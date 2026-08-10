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


def _heuristic_followups(query: str) -> List[str]:
    base = query.strip().rstrip("?")
    return [
        f"Can you tell me more about {base}?",
        "What are the most relevant papers on this topic?",
        "Who are the key researchers in this area?",
    ]


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


async def _synthesize(query: str, sources: List[Dict[str, Any]]) -> str:
    """Step 3 — one LLM call answering grounded ONLY in the numbered sources."""
    if sources:
        system = (
            "You are a research assistant. Answer the user's question using ONLY the numbered "
            "sources provided. Cite the sources you use inline with [n] matching their numbers. "
            "If the sources do not contain the answer, say so honestly. Be concise and factual — "
            "do not invent facts or citations."
        )
        user = (
            f"Question: {query}\n\nSources:\n{_format_sources_block(sources)}\n\n"
            "Answer with inline [n] citations:"
        )
    else:
        system = (
            "You are a research assistant. No sources were found in the knowledge base for the "
            "user's question. Tell the user honestly that you found no relevant information. "
            "Do not fabricate an answer."
        )
        user = f"Question: {query}"
    return await _llm(system, user, temperature=0.3, max_tokens=800)


@router.post("/chat")
async def rag_chat(req: ChatRequest) -> Dict[str, Any]:
    """Agentic RAG: plan → retrieve → synthesize, degrading to extractive on LLM/ES failure."""
    degraded = False

    # 1. PLAN
    plan = await _plan(req.query, req.history)

    # Explicit request entity_types override the plan.
    requested = [e for e in (req.entity_types or []) if e in _INDEX_CONFIG]
    entity_types = requested or plan["entity_types"] or list(_DEFAULT_ENTITY_TYPES)

    # 2. RETRIEVE
    try:
        query_vector = _embed(plan["expanded_query"])
    except Exception as e:
        logger.warning(f"[RAG] embedding failed: {e}")
        query_vector = None
    sources = _retrieve(query_vector, entity_types, req.top_k)
    used_entity_types = sorted({s["type"] for s in sources}) or entity_types

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

    # 4. FOLLOW-UPS
    followups = (plan.get("followups") or _heuristic_followups(req.query))[:3]

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
