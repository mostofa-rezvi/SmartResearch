"""
RAG Service — Agentic AI layer (additive) for SmartResearch.

Three capabilities layered on top of the existing HF LLM + SBERT embeddings +
Elasticsearch kNN stack, reusing what already exists:

Endpoints:
  POST /rag/chat       — agentic RAG chat over papers/researchers/posts (grounded, cited)
  POST /rag/summarize  — map-reduce volume summary over a collection of docs
  POST /rag/paper-qa   — question-answering grounded in a single paper's text

Design rules (per spec §2.1 / §3):
  * Additive only — this is a NEW file; the only edit elsewhere is a router
    registration line in main.py.
  * Graceful degradation everywhere — if the LLM (HF) or Elasticsearch is
    unavailable, endpoints still return sources + an extractive answer with
    `degraded: true` instead of raising. They never 500 the whole request.
  * Bounded agentic loop — /rag/chat uses at most 2 LLM calls + 2 retrieval rounds.

Reuses:
  * llm_service._hf_chat_sync / HF_AVAILABLE / HF_LLM_MODEL  (HF chat)
  * ml_model.get_model().encode                              (768-dim embeddings)
  * Elasticsearch kNN over indices: papers / posts / users
"""

import os
import re
import json
import asyncio
import logging
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

from ml_model import get_model
# Imported for reuse; referenced as module-level names so tests can monkeypatch them.
from llm_service import _hf_chat_sync, is_hf_available, HF_AVAILABLE, HF_LLM_MODEL  # noqa: F401
from knowledge_base import KB_DOCUMENTS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])

ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

# Entity type → ES index + which fields carry the title / body text.
# Map: researcher→users, paper→papers, post→posts.
_INDEX_CONFIG: Dict[str, Dict[str, Any]] = {
    "paper": {"index": "papers", "title_field": "title", "body_fields": ["abstract", "full_text"]},
    "post": {"index": "posts", "title_field": "title", "body_fields": ["content"]},
    "researcher": {"index": "users", "title_field": "name", "body_fields": ["content"]},
}
_DEFAULT_ENTITY_TYPES = ["paper", "researcher", "post"]

_SNIPPET_LEN = 240

_STOPWORDS = {
    "the", "and", "for", "are", "with", "that", "this", "from", "have", "has",
    "was", "were", "our", "their", "which", "into", "using", "used", "based",
    "study", "paper", "research", "results", "method", "methods", "approach",
    "these", "those", "such", "also", "can", "may", "not", "of", "in",
    "on", "to", "an", "is", "as", "by", "we", "it", "at", "be", "or",
}

# ── Small talk / greeting detection ──────────────────────────────────────────────
# Conversational openers ("hi", "thanks", "who are you") should NOT trigger
# retrieval — otherwise the assistant pulls in unrelated sources and answers
# "the provided sources do not contain an answer". These are answered directly.
_GREETING_WORDS = {
    "hi", "hii", "hey", "heya", "helo", "hello", "hiya", "howdy", "hola",
    "yo", "sup", "greetings", "hallo", "gday", "wassup",
}
_GREETING_PHRASES = {
    "good morning", "good afternoon", "good evening", "good day", "good night",
    "hows it going", "how are you", "how are you doing", "how is it going",
    "how do you do", "whats up", "what is up", "nice to meet you", "morning",
}
_THANKS_WORDS = {"thanks", "thank", "thankyou", "thx", "ty", "cheers", "appreciate"}
_BYE_WORDS = {"bye", "goodbye", "cya", "later", "farewell", "adios"}
# Filler that may accompany a greeting without turning it into a real question.
_GREETING_FILLER = {
    "there", "how", "are", "you", "doing", "is", "it", "going", "today",
    "good", "morning", "afternoon", "evening", "night", "day", "assistant",
    "ai", "bot", "again", "ok", "okay", "well", "hope", "please", "just",
    "so", "hey", "a", "the", "im", "me", "my",
}
_HELP_PHRASES = {
    "help", "what can you do", "what do you do", "who are you", "what is this",
    "what are you", "how do you work", "how can you help", "what can you help with",
    "what can i ask", "what can i do here",
}

_STARTER_FOLLOWUPS = [
    "Who works on low-resource NLP?",
    "Summarize recent work on graph neural networks",
    "What are people discussing about reproducibility?",
]
_GREETING_TEXT = (
    "Hello! 👋 I'm your AI Research Assistant. Ask me about papers, researchers, "
    "or what the community is discussing, and I'll find grounded, cited answers "
    "for you. What would you like to explore?"
)
_CAPABILITY_TEXT = (
    "Hi! I'm your AI Research Assistant. I can help you:\n"
    "• Find papers and summarize research on a topic\n"
    "• Discover researchers and experts in a field\n"
    "• See what the community is discussing\n\n"
    "Try asking something like \"Who works on low-resource NLP?\" or "
    "\"Summarize recent work on graph neural networks.\""
)
_THANKS_TEXT = (
    "You're welcome! Happy to help with your research anytime. "
    "What would you like to explore next?"
)
_BYE_TEXT = "Goodbye! Come back anytime you need to dig into research. 👋"

# ── Research-only scope gate ──────────────────────────────────────────────────────
# The assistant answers RESEARCH questions only. Everything is retrieved from a
# research corpus (papers + researchers + posts) plus a curated research knowledge
# base, so relevance is a reliable topic signal: on-topic research queries land the
# top source at ~0.75–0.90 while off-topic chit-chat (cooking, sports, …) tops out
# near ~0.55 because nothing in the corpus is close. Below this floor we decline
# politely instead of letting the LLM ramble over weak, unrelated sources.
_RESEARCH_SCOPE_FLOOR = float(os.getenv("RAG_SCOPE_FLOOR", "0.60"))
_OFF_TOPIC_TEXT = (
    "I'm the ResearchBridge AI Research Assistant, so I can only help with "
    "research-related questions — finding papers, discovering researchers and "
    "experts, summarizing a body of work, understanding a concept, or navigating "
    "the platform. I couldn't find anything in the research knowledge base that "
    "matches that question. Try asking something like \"Who works on low-resource "
    "NLP?\" or \"Summarize recent work on graph neural networks.\""
)


def _smalltalk_answer(query: str) -> Optional[Dict[str, Any]]:
    """Detect greetings / thanks / capability questions and answer them directly.

    Returns a ``{"answer", "followups"}`` dict for conversational messages, or
    ``None`` when the query is a genuine research question that should go through
    the full plan → retrieve → synthesize pipeline.
    """
    q = (query or "").strip().lower()
    if not q:
        return None
    tokens = re.findall(r"[a-z']+", q)
    if not tokens:
        return None
    token_set = set(tokens)
    compact = " ".join(tokens)

    # Capability / identity questions ("what can you do", "who are you", "help").
    if compact in _HELP_PHRASES or (
        len(tokens) <= 6
        and "you" in token_set
        and ("what" in token_set or "how" in token_set)
        and ("do" in token_set or "help" in token_set or "work" in token_set)
    ):
        return {"answer": _CAPABILITY_TEXT, "followups": list(_STARTER_FOLLOWUPS)}

    def _only_filler(extra: set) -> bool:
        return all(t in extra or t in _GREETING_FILLER for t in tokens)

    # Greetings: an exact phrase, or a greeting word with only filler around it.
    if compact in _GREETING_PHRASES or (
        (token_set & _GREETING_WORDS) and _only_filler(_GREETING_WORDS)
    ):
        return {"answer": _GREETING_TEXT, "followups": list(_STARTER_FOLLOWUPS)}

    # Thanks.
    if (token_set & _THANKS_WORDS) and _only_filler(_THANKS_WORDS):
        return {"answer": _THANKS_TEXT, "followups": list(_STARTER_FOLLOWUPS)}

    # Farewell.
    if (token_set & _BYE_WORDS) and _only_filler(_BYE_WORDS):
        return {"answer": _BYE_TEXT, "followups": []}

    return None


# ── Request models ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = None
    top_k: int = 6
    entity_types: Optional[List[str]] = None


class SummaryDoc(BaseModel):
    id: str
    title: str = ""
    text: str = ""


class SummarizeRequest(BaseModel):
    documents: List[SummaryDoc]
    scope_label: Optional[str] = None


class PaperQARequest(BaseModel):
    question: str
    title: Optional[str] = None
    text: str
    top_k: int = 4


# ── Small helpers ────────────────────────────────────────────────────────────────

def _truncate(text: str, limit: int) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _snippet(title: str, body: str, limit: int = _SNIPPET_LEN) -> str:
    combined = f"{title}. {body}".strip() if body else (title or "")
    return _truncate(" ".join(combined.split()), limit)


def _parse_json(raw: str) -> Optional[Any]:
    """Robustly isolate a JSON object/array from an LLM response.

    Mirrors the tolerant parser in llm_service (strip ``` fences, then isolate
    the outermost {...} or [...]).
    """
    if not raw:
        return None
    clean = re.sub(r"```(?:json)?", "", raw).strip()
    candidates: List[str] = []
    for open_ch, close_ch in (("{", "}"), ("[", "]")):
        start, end = clean.find(open_ch), clean.rfind(close_ch)
        if start != -1 and end != -1 and end > start:
            candidates.append(clean[start:end + 1])
    for frag in candidates:
        try:
            return json.loads(frag)
        except (json.JSONDecodeError, ValueError):
            continue
    return None


async def _llm(system: str, user: str, temperature: float = 0.4, max_tokens: int = 1024) -> str:
    """Async wrapper around the blocking HF chat call (runs in a thread)."""
    return await asyncio.to_thread(_hf_chat_sync, system, user, temperature, max_tokens)


def _embed(text: str) -> List[float]:
    vec = get_model().encode(text)
    return vec.tolist() if hasattr(vec, "tolist") else list(vec)


def _get_es():
    """Construct an Elasticsearch client. Isolated so tests can patch it."""
    from elasticsearch import Elasticsearch
    return Elasticsearch(ELASTICSEARCH_URL)


def _top_keywords(texts: List[str], n: int = 5) -> List[str]:
    freq: Dict[str, int] = {}
    for t in texts:
        for tok in re.findall(r"[a-zA-Z][a-zA-Z\-]{2,}", (t or "").lower()):
            if tok in _STOPWORDS:
                continue
            freq[tok] = freq.get(tok, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:n]]


# ── Retrieval (ES kNN) ───────────────────────────────────────────────────────────

def _retrieve(query_vector: Optional[List[float]], entity_types: List[str], k: int) -> List[Dict[str, Any]]:
    """kNN over the chosen indices; returns up to k sources overall (highest score first).

    Any ES failure (missing/empty index, connection error) degrades to fewer/no
    results rather than raising.
    """
    if not query_vector:
        return []
    try:
        es = _get_es()
    except Exception as e:  # pragma: no cover - construction rarely fails
        logger.warning(f"[RAG] Elasticsearch unavailable: {e}")
        return []

    sources: List[Dict[str, Any]] = []
    for et in entity_types:
        cfg = _INDEX_CONFIG.get(et)
        if not cfg:
            continue
        body = {
            "knn": {
                "field": "embedding",
                "query_vector": query_vector,
                "k": k,
                "num_candidates": 100,
            }
        }
        try:
            res = es.search(index=cfg["index"], body=body)
        except Exception as e:
            logger.warning(f"[RAG] ES search failed for index '{cfg['index']}': {e}")
            continue
        for hit in res.get("hits", {}).get("hits", []):
            src = hit.get("_source", {}) or {}
            title = str(src.get(cfg["title_field"]) or "(untitled)")
            body_text = " ".join(
                str(src.get(f, "")) for f in cfg["body_fields"] if src.get(f)
            )
            sources.append({
                "id": str(hit.get("_id")),
                "type": et,
                "title": title,
                "snippet": _snippet(title, body_text),
                "score": float(hit.get("_score", 0.0) or 0.0),
            })

    sources.sort(key=lambda s: s["score"], reverse=True)
    return sources[:k]


# ── Knowledge base (platform docs) retrieval ─────────────────────────────────────

# Raw cosine a KB doc must clear to count as relevant. Tuned against real SBERT
# embeddings: on-topic platform/research queries score ~0.25–0.85 while off-topic
# chit-chat tops out near ~0.16, so 0.22 separates them with margin.
_KB_MIN_SCORE = 0.22
_kb_vectors: Optional[np.ndarray] = None
_kb_ready = False


def _ensure_kb_embeddings() -> Optional[np.ndarray]:
    """Embed the knowledge-base docs once (lazily) and cache the matrix.

    Uses the same SBERT model as content search so KB and content live in the
    same vector space. Any failure degrades to "no KB" rather than raising.
    """
    global _kb_vectors, _kb_ready
    if _kb_ready:
        return _kb_vectors
    _kb_ready = True
    try:
        texts = [f"{d['title']}. {d['content']}" for d in KB_DOCUMENTS]
        _kb_vectors = np.asarray(get_model().encode(texts), dtype=float)
        if _kb_vectors.ndim == 1:  # single doc → make 2-D
            _kb_vectors = _kb_vectors.reshape(1, -1)
    except Exception as e:  # pragma: no cover - model load rarely fails here
        logger.warning(f"[RAG] KB embedding failed: {e}")
        _kb_vectors = None
    return _kb_vectors


def _retrieve_kb(query_vector: Optional[List[float]], k: int = 4,
                 min_score: float = _KB_MIN_SCORE) -> List[Dict[str, Any]]:
    """Cosine-rank the knowledge base; return up to k docs above threshold.

    Each doc keeps its own type (``guide`` for platform how-to, ``concept`` for
    research knowledge) so the assistant can both explain platform features and
    answer domain questions even when the indexed corpus is thin. Independent of
    Elasticsearch, so it works even when ES is down. The raw cosine must clear
    ``min_score`` (keeps irrelevant queries from pulling docs in); the reported
    ``score`` is normalized to 0–1 to sort fairly against ES cosine scores.
    """
    if not query_vector or not KB_DOCUMENTS:
        return []
    vecs = _ensure_kb_embeddings()
    if vecs is None or len(vecs) == 0:
        return []
    q = np.asarray(query_vector, dtype=float)
    q = q / (np.linalg.norm(q) + 1e-9)
    mat = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)
    scores = mat @ q
    order = np.argsort(-scores)[:k]
    out: List[Dict[str, Any]] = []
    for i in order:
        cos = float(scores[int(i)])
        if cos < min_score:
            continue
        d = KB_DOCUMENTS[int(i)]
        out.append({
            "id": str(d["id"]),
            "type": d.get("type", "guide"),
            "title": d["title"],
            "snippet": _snippet(d["title"], d["content"]),
            "score": (1.0 + cos) / 2.0,  # normalize to match ES cosine scoring
        })
    return out


# ── /rag/chat — agentic RAG ──────────────────────────────────────────────────────

def _heuristic_entity_types(query: str) -> List[str]:
    q = query.lower()
    types: List[str] = []
    if any(w in q for w in ["who", "researcher", "author", "people", "expert", "works on", "professor"]):
        types.append("researcher")
    if any(w in q for w in ["paper", "study", "publication", "article", "dataset", "method", "research on"]):
        types.append("paper")
    if any(w in q for w in ["post", "discussion", "forum", "thread", "opinion", "community"]):
        types.append("post")
    return types or list(_DEFAULT_ENTITY_TYPES)


_QUESTION_STEMS = re.compile(
    r"^(what(?:'s| is| are)?|whats|who(?:'s| is| are)?|how(?: do| can| does)?|why|when|where|"
    r"which|can you|could you|please|tell me|give me|show me|find|list|explain|describe|"
    r"summarize|is|are|do|does)\b[\s,:]*", re.I)
_LEAD_FILLER = re.compile(r"^(me\s+)?(about|on|the|a|an|some|any|for|of|to)\b\s*", re.I)
_QUALIFIER = re.compile(
    r"^(best|top|good|better|recent|latest|newest|most|more|popular|key|main|important|"
    r"notable|influential|seminal|relevant|famous|great|useful|interesting|leading)\b\s*", re.I)
_RESEARCH_NOUN_LEAD = re.compile(
    r"^(papers?|research|studies|study|works?|articles?|publications?|literature)\b\s*", re.I)
_RESEARCH_NOUN_TRAIL = re.compile(
    r"\s*\b(papers?|research|studies|study|works?|articles?|publications?|literature)$", re.I)
_TRAIL_PREP = re.compile(r"\s+\b(in|on|of|for|about|to|with|and|the|a|an)$", re.I)

_PLATFORM_FOLLOWUPS = [
    "What can the AI assistant help me with?",
    "How do I find researchers to collaborate with?",
    "How do I organize papers in my library?",
]


def _clean_topic(query: str) -> str:
    """Reduce a question to a short topic phrase for natural follow-up prompts."""
    t = (query or "").strip().rstrip("?.! ")
    prev = None
    while t and t != prev:  # peel stacked stems like "what are the best ... papers"
        prev = t
        t = _QUESTION_STEMS.sub("", t).strip()
        t = _LEAD_FILLER.sub("", t).strip()
        t = _QUALIFIER.sub("", t).strip()
        t = _RESEARCH_NOUN_LEAD.sub("", t).strip()
        t = _RESEARCH_NOUN_TRAIL.sub("", t).strip()
        t = _TRAIL_PREP.sub("", t).strip()
    t = t or (query or "").strip().rstrip("?")
    return t if len(t) <= 64 else t[:63].rstrip() + "…"


def _short_title(title: str, limit: int = 52) -> str:
    t = (title or "").strip()
    return t if len(t) <= limit else t[: limit - 1].rstrip() + "…"


def _heuristic_followups(query: str) -> List[str]:
    topic = _clean_topic(query)
    return [
        f"What are the most influential papers on {topic}?",
        f"Who are the leading researchers in {topic}?",
        f"What are the open challenges in {topic}?",
    ]


def _usable_title(source: Dict[str, Any]) -> bool:
    t = (source.get("title") or "").strip().lower()
    return bool(t) and t != "(untitled)"


def _build_followups(query: str, sources: List[Dict[str, Any]],
                     plan_followups: Optional[List[str]]) -> List[str]:
    """Compose natural, real-world follow-up questions.

    Prefers prompts anchored to the ACTUAL retrieved papers/researchers so the
    suggestions read like genuine next questions; falls back to platform prompts
    for how-to answers, then to the planner's or heuristic topic prompts.
    """
    papers = [s for s in sources if s.get("type") == "paper" and _usable_title(s)]
    researchers = [s for s in sources if s.get("type") == "researcher" and _usable_title(s)]
    guides = [s for s in sources if s.get("type") == "guide"]

    outs: List[str] = []
    if papers:
        outs.append(f"Summarize the key contributions of “{_short_title(papers[0]['title'])}”.")
    if researchers:
        outs.append(f"What has {_short_title(researchers[0]['title'], 40)} published recently?")
    if len(outs) < 3 and len(papers) > 1:
        outs.append(f"How does “{_short_title(papers[1]['title'])}” compare to related work?")
    elif papers and len(outs) < 3:
        outs.append(f"What are the best papers on {_clean_topic(query)}?")

    if not outs and guides:
        outs = list(_PLATFORM_FOLLOWUPS)

    # Top up (dedup, preserve order) from the planner's suggestions then heuristics.
    for f in list(plan_followups or []) + _heuristic_followups(query):
        if len(outs) >= 3:
            break
        f = (f or "").strip()
        if f and f not in outs:
            outs.append(f)
    return outs[:3]


def _heuristic_plan(query: str) -> Dict[str, Any]:
    return {
        "expanded_query": query,
        "entity_types": _heuristic_entity_types(query),
        "followups": _heuristic_followups(query),
    }


async def _plan(query: str, history: Optional[List[ChatMessage]]) -> Dict[str, Any]:
    """Step 1 — one LLM call to expand the query + pick entity types (heuristic fallback)."""
    if not is_hf_available():
        return _heuristic_plan(query)
    system = (
        "You are a retrieval planner for a research knowledge base containing papers, "
        "researchers, and forum posts. Respond with a SINGLE valid JSON object and nothing else."
    )
    hist_txt = ""
    if history:
        hist_txt = "\n".join(f"{m.role}: {m.content}" for m in history[-4:])
    user = f"""Conversation so far:
{hist_txt or "(none)"}

User question: {query}

Plan the retrieval. Respond in this EXACT JSON shape:
{{
  "expanded_query": "<a search-friendly rewrite of the question>",
  "entity_types": [<subset of "paper","researcher","post" most relevant>],
  "followups": ["<short follow-up question>", "<another>", "<another>"]
}}"""
    try:
        raw = await _llm(system, user, temperature=0.3, max_tokens=400)
        data = _parse_json(raw) or {}
        ets = [e for e in data.get("entity_types", []) if e in _INDEX_CONFIG]
        followups = [f for f in data.get("followups", []) if isinstance(f, str) and f.strip()]
        return {
            "expanded_query": (data.get("expanded_query") or query).strip() or query,
            "entity_types": ets or _heuristic_entity_types(query),
            "followups": followups[:3] or _heuristic_followups(query),
        }
    except Exception as e:
        logger.warning(f"[RAG] plan LLM call failed, using heuristic: {e}")
        return _heuristic_plan(query)


def _format_sources_block(sources: List[Dict[str, Any]]) -> str:
    return "\n".join(
        f"[{i + 1}] ({s['type']}) {s['title']}: {s['snippet']}" for i, s in enumerate(sources)
    )


def _extractive_answer(sources: List[Dict[str, Any]]) -> str:
    if not sources:
        return "I couldn't find any relevant information in the knowledge base for your question."
    parts = [f"[{i + 1}] {s['snippet']}" for i, s in enumerate(sources[:3])]
    return "Based on the most relevant sources I found:\n" + "\n".join(parts)


_ASSISTANT_PERSONA = (
    "You are ResearchBridge's AI Research Assistant. ResearchBridge is a collaborative "
    "research platform for discovering papers, connecting with researchers, managing a "
    "personal library, collaborating in teams, and publishing. Sources tagged (guide) are "
    "first-party documentation about the platform; (concept) sources are curated research "
    "knowledge (AI/ML concepts and research methodology); (paper), (researcher), and (post) "
    "sources are content from the platform's corpus."
)


async def _synthesize(query: str, sources: List[Dict[str, Any]]) -> str:
    """Step 3 — one LLM call answering grounded in the numbered sources."""
    if sources:
        system = (
            f"{_ASSISTANT_PERSONA}\n\n"
            "The numbered sources below ARE your knowledge base — they were retrieved for this "
            "exact question. Answer using them, following these rules:\n"
            "1. Lead with the answer. Do NOT open with disclaimers. If a source's topic matches "
            "the question, that source IS the answer — never say you 'couldn't find' something "
            "that is clearly present in the sources.\n"
            "2. Be specific and name names. For a person, give their name, institution, and the "
            "relevant research interests. For a paper, give its title and what it contributes.\n"
            "3. Cite every claim inline with [n] matching the source numbers.\n"
            "4. For recommendation questions ('best papers on X', 'who works on Y'), recommend the "
            "most relevant sources BY NAME and briefly say why each fits — treat the sources as the "
            "candidate set, even on a partial match.\n"
            "5. Use (guide) sources to explain platform features and how-tos.\n"
            "6. Only if NONE of the sources relate to the question at all should you say you "
            "couldn't find a close match, then suggest a refinement.\n"
            "7. If the question is not about research, science, academia, or this platform, "
            "politely reply that you only help with research topics.\n"
            "Never invent papers, people, or citations. Be concise, confident, and factual."
        )
        user = (
            f"Question: {query}\n\nSources:\n{_format_sources_block(sources)}\n\n"
            "Answer directly, citing sources inline with [n]:"
        )
    else:
        system = (
            f"{_ASSISTANT_PERSONA} No sources were found in the corpus for the user's question. "
            "Answer helpfully from what you know about the platform: if it's a how-to or feature "
            "question, explain the relevant ResearchBridge feature; otherwise tell the user you "
            "found no matching content and suggest how they might refine their search. Do not "
            "fabricate specific papers, people, or citations."
        )
        user = f"Question: {query}"
    return await _llm(system, user, temperature=0.3, max_tokens=800)


@router.post("/chat")
async def rag_chat(req: ChatRequest) -> Dict[str, Any]:
    """Agentic RAG: plan → retrieve → synthesize, degrading to extractive on LLM/ES failure."""
    degraded = False

    # 0. SMALL TALK — greetings / thanks / "what can you do" get a direct,
    #    conversational reply and skip retrieval entirely (no spurious sources).
    smalltalk = _smalltalk_answer(req.query)
    if smalltalk is not None:
        return {
            "answer": smalltalk["answer"],
            "sources": [],
            "followups": smalltalk["followups"],
            "used_entity_types": [],
            "degraded": False,
        }

    # 1. PLAN
    plan = await _plan(req.query, req.history)

    # Explicit request entity_types override the plan.
    requested = [e for e in (req.entity_types or []) if e in _INDEX_CONFIG]
    entity_types = requested or plan["entity_types"] or list(_DEFAULT_ENTITY_TYPES)

    # 2. RETRIEVE — content (ES) + relevant platform knowledge-base docs.
    try:
        query_vector = _embed(plan["expanded_query"])
    except Exception as e:
        logger.warning(f"[RAG] embedding failed: {e}")
        query_vector = None
    content_sources = _retrieve(query_vector, entity_types, req.top_k)
    kb_sources = _retrieve_kb(query_vector)
    # Merge content + knowledge base, rank by (normalized) score, and cap. The KB
    # backstops a thin corpus so real questions still get grounded, cited answers.
    merged = content_sources + kb_sources
    merged.sort(key=lambda s: s.get("score", 0.0), reverse=True)
    sources = merged[: max(req.top_k, 6)]
    used_entity_types = sorted({s["type"] for s in sources}) or entity_types

    # 2b. RESEARCH-SCOPE GATE — if nothing in the research corpus/KB is close, the
    #     question is off-topic (or has no match). Decline politely instead of
    #     letting the LLM ramble over weak, unrelated sources.
    top_score = sources[0]["score"] if sources else 0.0
    if top_score < _RESEARCH_SCOPE_FLOOR:
        return {
            "answer": _OFF_TOPIC_TEXT,
            "sources": [],
            "followups": list(_STARTER_FOLLOWUPS),
            "used_entity_types": [],
            "degraded": False,
        }

    # 3. SYNTHESIZE (with graceful degrade)
    answer: Optional[str] = None
    if is_hf_available():
        try:
            answer = await _synthesize(req.query, sources)
        except Exception as e:
            logger.warning(f"[RAG] synthesis LLM call failed, degrading: {e}")
            answer = None
    if answer is None:
        answer = _extractive_answer(sources)
        degraded = True

    # 4. FOLLOW-UPS — anchored to the real retrieved sources when possible.
    followups = _build_followups(req.query, sources, plan.get("followups"))

    return {
        "answer": answer,
        "sources": sources,
        "followups": followups,
        "used_entity_types": used_entity_types,
        "degraded": degraded,
    }


# ── /rag/summarize — map-reduce ──────────────────────────────────────────────────

_SUMMARIZE_DOC_CAP = 20
_SUMMARIZE_TEXT_CAP = 3000
_MAP_BATCH_SIZE = 5


async def _map_summaries(docs: List[SummaryDoc]) -> Dict[str, str]:
    """Map step — summarize each doc in 1-2 sentences, batched into few LLM calls."""
    summaries: Dict[str, str] = {}
    for start in range(0, len(docs), _MAP_BATCH_SIZE):
        batch = docs[start:start + _MAP_BATCH_SIZE]
        system = (
            "You are a research summarizer. For each numbered document, write a 1-2 sentence "
            "summary of its core contribution. Respond with a SINGLE JSON array and nothing else."
        )
        blocks = "\n\n".join(
            f'Document id="{d.id}" title="{d.title}":\n{_truncate(d.text, _SUMMARIZE_TEXT_CAP)}'
            for d in batch
        )
        user = (
            f"{blocks}\n\n"
            'Respond as: [{"id": "<id>", "summary": "<1-2 sentences>"}, ...]'
        )
        try:
            raw = await _llm(system, user, temperature=0.3, max_tokens=700)
            parsed = _parse_json(raw)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict) and item.get("id") is not None:
                        summaries[str(item["id"])] = str(item.get("summary", "")).strip()
        except Exception as e:
            logger.warning(f"[RAG] summarize map batch failed: {e}")
            # Leave these docs without a mini-summary; reduce/degrade still works.
    return summaries


async def _reduce_summary(docs: List[SummaryDoc], minis: Dict[str, str]) -> Dict[str, Any]:
    """Reduce step — one LLM call producing overview + themes + notable."""
    lines = "\n".join(
        f'- id={d.id} | {d.title}: {minis.get(d.id) or _truncate(d.text, 200)}' for d in docs
    )
    system = (
        "You are a research analyst. Given per-document summaries, synthesize the collection. "
        "Respond with a SINGLE valid JSON object and nothing else."
    )
    user = f"""Documents:
{lines}

Produce this EXACT JSON shape:
{{
  "overview": "<3-5 sentence overview of the whole collection>",
  "themes": [
    {{"theme": "<short theme name>", "summary": "<1-2 sentences>", "papers": ["<id>", "..."]}}
  ],
  "notable": [
    {{"id": "<id>", "title": "<title>", "why": "<why it stands out>"}}
  ]
}}"""
    raw = await _llm(system, user, temperature=0.4, max_tokens=1200)
    data = _parse_json(raw)
    if not isinstance(data, dict):
        raise ValueError("reduce did not return a JSON object")
    return {
        "overview": str(data.get("overview", "")).strip(),
        "themes": data.get("themes", []) if isinstance(data.get("themes"), list) else [],
        "notable": data.get("notable", []) if isinstance(data.get("notable"), list) else [],
    }


def _extractive_summary(docs: List[SummaryDoc]) -> Dict[str, Any]:
    """Degraded path — build an overview from titles + naive keyword themes."""
    titles = [d.title for d in docs if d.title]
    overview = f"This collection contains {len(docs)} document(s)"
    if titles:
        overview += ": " + "; ".join(titles[:10])
        if len(titles) > 10:
            overview += f"; and {len(titles) - 10} more"
    overview += "."

    keywords = _top_keywords([f"{d.title} {d.text}" for d in docs], n=5)
    themes: List[Dict[str, Any]] = []
    for kw in keywords:
        papers = [d.id for d in docs if kw in f"{d.title} {d.text}".lower()][:5]
        themes.append({
            "theme": kw,
            "summary": f"Documents related to '{kw}'.",
            "papers": papers,
        })

    notable = [
        {"id": d.id, "title": d.title, "why": "Representative item in the collection."}
        for d in docs[:3]
    ]
    return {"overview": overview, "themes": themes, "notable": notable}


@router.post("/summarize")
async def rag_summarize(req: SummarizeRequest) -> Dict[str, Any]:
    """Map-reduce volume summary; degrades to extractive theme extraction without the LLM."""
    docs = req.documents[:_SUMMARIZE_DOC_CAP]
    doc_count = len(docs)
    degraded = False

    result: Optional[Dict[str, Any]] = None
    if is_hf_available() and docs:
        try:
            minis = await _map_summaries(docs)
            result = await _reduce_summary(docs, minis)
        except Exception as e:
            logger.warning(f"[RAG] summarize LLM pipeline failed, degrading: {e}")
            result = None
    if result is None:
        result = _extractive_summary(docs)
        degraded = True

    result["doc_count"] = doc_count
    result["degraded"] = degraded
    return result


# ── /rag/paper-qa — single-paper QA ──────────────────────────────────────────────

def _chunk_text(text: str, size: int = 1000, overlap: int = 150) -> List[str]:
    text = text or ""
    if not text.strip():
        return []
    step = max(1, size - overlap)
    chunks: List[str] = []
    for i in range(0, len(text), step):
        chunk = text[i:i + size].strip()
        if chunk:
            chunks.append(chunk)
        if i + size >= len(text):
            break
    return chunks or [text.strip()]


def _cosine_topk(q_vec: np.ndarray, chunk_vecs: np.ndarray, chunks: List[str], k: int) -> List[tuple]:
    q = q_vec / (np.linalg.norm(q_vec) + 1e-9)
    norms = np.linalg.norm(chunk_vecs, axis=1, keepdims=True) + 1e-9
    mat = chunk_vecs / norms
    scores = mat @ q
    order = np.argsort(-scores)[:k]
    return [(chunks[i], float(scores[i])) for i in order]


async def _paper_answer(question: str, title: Optional[str], top_chunks: List[tuple]) -> str:
    quotes_block = "\n\n".join(f'[{i + 1}] "{c}"' for i, (c, _s) in enumerate(top_chunks))
    system = (
        "You are a research assistant answering a question about ONE paper. Use ONLY the provided "
        "excerpts. Quote or reference the relevant excerpt(s) by their [n] number. If the excerpts "
        "do not answer the question, say so honestly. Be concise."
    )
    user = (
        f"Paper: {title or 'Untitled'}\n\nQuestion: {question}\n\n"
        f"Excerpts:\n{quotes_block}\n\nAnswer, citing excerpts with [n]:"
    )
    return await _llm(system, user, temperature=0.3, max_tokens=700)


@router.post("/paper-qa")
async def rag_paper_qa(req: PaperQARequest) -> Dict[str, Any]:
    """QA grounded in a single paper: chunk → embed → cosine top_k → grounded LLM answer."""
    degraded = False
    chunks = _chunk_text(req.text)

    top: List[tuple] = []
    if chunks:
        try:
            model = get_model()
            q_vec = np.asarray(model.encode(req.question), dtype=float)
            c_vecs = np.asarray(model.encode(chunks), dtype=float)
            if c_vecs.ndim == 1:  # single chunk → make it 2-D
                c_vecs = c_vecs.reshape(1, -1)
            top = _cosine_topk(q_vec, c_vecs, chunks, max(1, req.top_k))
        except Exception as e:
            logger.warning(f"[RAG] paper-qa embedding/ranking failed: {e}")
            top = [(c, 0.0) for c in chunks[: max(1, req.top_k)]]

    supporting_quotes = [
        {"quote": _truncate(c, 300), "score": round(s, 4)} for c, s in top
    ]

    answer: Optional[str] = None
    if is_hf_available() and top:
        try:
            answer = await _paper_answer(req.question, req.title, top)
        except Exception as e:
            logger.warning(f"[RAG] paper-qa LLM call failed, degrading: {e}")
            answer = None
    if answer is None:
        answer = top[0][0] if top else "No text was provided to answer the question."
        degraded = True

    return {"answer": answer, "supporting_quotes": supporting_quotes, "degraded": degraded}
