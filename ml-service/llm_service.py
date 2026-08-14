"""
LLM Service — Hugging Face-powered citation generation and writing feedback.

Uses the Hugging Face Inference Providers router (OpenAI-compatible chat
completions endpoint) so any hosted instruct model can be swapped in via
the HF_LLM_MODEL env var without code changes.

Endpoints:
  POST /llm/citations  — Generate formatted citations (BibTeX/APA/IEEE)
  POST /llm/feedback   — Return structured writing feedback for a paper abstract

Config:
  HF_API_TOKEN  — Hugging Face access token (required; endpoints return 503 without it)
  HF_LLM_MODEL  — model id (default: meta-llama/Llama-3.1-8B-Instruct)
"""

import os
import asyncio
import logging
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal

logger = logging.getLogger(__name__)

# ── LLM provider setup ──────────────────────────────────────────────────────────
# Default provider is a LOCAL Ollama server (OpenAI-compatible API) so the app
# needs no cloud token or key. Set LLM_PROVIDER=hf to use the Hugging Face router.
def get_llm_provider() -> str:
    return os.getenv("LLM_PROVIDER", "ollama").strip().lower()

def get_ollama_base() -> str:
    return os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1").rstrip("/")

def get_ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL", "llama3.2:3b")

def get_hf_token() -> str:
    return os.getenv("HF_API_TOKEN", "")

def get_hf_model() -> str:
    return os.getenv("HF_LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")

def get_active_model() -> str:
    return get_ollama_model() if get_llm_provider() == "ollama" else get_hf_model()

def is_hf_available() -> bool:
    """True when an LLM backend is usable: local Ollama (no token) or HF with a token.
    Name kept for import stability across the service."""
    return get_llm_provider() == "ollama" or bool(get_hf_token())

HF_API_TOKEN = get_hf_token()
HF_LLM_MODEL = get_active_model()   # label used in `generated_by`
HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions"
HF_AVAILABLE = is_hf_available()

router = APIRouter(prefix="/llm", tags=["LLM"])


# ── Request / Response models ──────────────────────────────────────────────────

class CitationRequest(BaseModel):
    title: str
    authors: list[str]          # e.g. ["Jane Doe", "John Smith"]
    journal: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    format: Literal["bibtex", "apa", "ieee"] = "bibtex"


class CitationResponse(BaseModel):
    format: str
    citation: str
    generated_by: str


class FeedbackRequest(BaseModel):
    abstract: str
    title: Optional[str] = None
    research_area: Optional[str] = None


class FeedbackItem(BaseModel):
    dimension: str
    score: int          # 1–10
    comment: str
    suggestions: list[str]


class FeedbackResponse(BaseModel):
    overall_score: int
    summary: str
    items: list[FeedbackItem]
    generated_by: str


# ── Helper: call Hugging Face chat completions ──────────────────────────────────

def _hf_chat_sync(system: str, user: str, temperature: float = 0.4, max_tokens: int = 1024) -> str:
    """Blocking POST to an OpenAI-compatible chat endpoint (local Ollama or the HF
    router). Returns the assistant text. Name kept for import stability."""
    provider = get_llm_provider()
    if provider == "ollama":
        url = f"{get_ollama_base()}/chat/completions"
        model = get_ollama_model()
        headers = {"Content-Type": "application/json"}
        timeout = 180  # local CPU inference is slower than a hosted API
    else:
        url = HF_CHAT_URL
        model = get_hf_model()
        headers = {"Authorization": f"Bearer {get_hf_token()}", "Content-Type": "application/json"}
        timeout = 55
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
    if resp.status_code != 200:
        raise RuntimeError(f"{provider} LLM API {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


async def _call_llm(system: str, user: str, **kwargs) -> str:
    """Async wrapper — runs the blocking HF call in a thread and maps errors to HTTP codes."""
    if not is_hf_available():
        raise HTTPException(status_code=503, detail="LLM service not configured. Set HF_API_TOKEN.")
    try:
        return await asyncio.to_thread(_hf_chat_sync, system, user, **kwargs)
    except Exception as e:
        logger.error(f"[LLM] Hugging Face call failed: {e}")
        raise HTTPException(status_code=502, detail=f"LLM call failed: {str(e)}")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/citations", response_model=CitationResponse)
async def generate_citation(req: CitationRequest):
    """
    Generate a formatted citation from paper metadata.
    Supports BibTeX, APA 7th edition, and IEEE format.
    """
    authors_str = ", ".join(req.authors)

    format_instructions = {
        "bibtex": (
            "Generate a valid BibTeX entry. Use @article for journal papers. "
            "Output ONLY the BibTeX block, no explanation. "
            "The cite key should be the first author's last name + year (e.g., Smith2023)."
        ),
        "apa": (
            "Generate an APA 7th edition reference. "
            "Output ONLY the formatted reference string, no explanation."
        ),
        "ieee": (
            "Generate an IEEE reference list entry. "
            "Output ONLY the formatted string with proper brackets, no explanation."
        ),
    }

    system = f"You are an academic citation formatter. {format_instructions[req.format]}"
    user = f"""Paper details:
- Title: {req.title}
- Authors: {authors_str}
- Journal/Conference: {req.journal or "Unknown"}
- Year: {req.year or "Unknown"}
- DOI: {req.doi or "Not available"}
- Volume: {req.volume or "N/A"}, Issue: {req.issue or "N/A"}, Pages: {req.pages or "N/A"}

Format: {req.format.upper()}
"""

    citation = await _call_llm(system, user, temperature=0.2, max_tokens=512)
    # Strip markdown code fences some models wrap the output in
    import re
    citation = re.sub(r"^```(?:bibtex|latex|text)?\n?|```$", "", citation.strip()).strip()
    return CitationResponse(format=req.format, citation=citation, generated_by=HF_LLM_MODEL)


@router.post("/feedback", response_model=FeedbackResponse)
async def get_writing_feedback(req: FeedbackRequest):
    """
    Provide structured writing feedback on a paper abstract.
    Returns scored feedback across 5 dimensions.
    """
    system = (
        "You are an expert academic peer reviewer. "
        "You always respond with a single valid JSON object and nothing else — no markdown, no prose."
    )
    user = f"""Analyze the following research abstract and provide structured feedback.

Title: {req.title or "Not provided"}
Research Area: {req.research_area or "Not specified"}

Abstract:
{req.abstract}

Respond in the following EXACT JSON format:
{{
  "overall_score": <integer 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "items": [
    {{"dimension": "Clarity", "score": <integer 1-10>, "comment": "<specific observation>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}},
    {{"dimension": "Novelty & Contribution", "score": <integer 1-10>, "comment": "<specific observation>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}},
    {{"dimension": "Methodology", "score": <integer 1-10>, "comment": "<specific observation>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}},
    {{"dimension": "Research Gap", "score": <integer 1-10>, "comment": "<specific observation>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}},
    {{"dimension": "Impact & Scope", "score": <integer 1-10>, "comment": "<specific observation>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}}
  ]
}}"""

    raw = await _call_llm(system, user, temperature=0.4, max_tokens=1200)

    # Parse JSON from the LLM response
    import json, re
    try:
        # Strip markdown code fences if present, then isolate the JSON object
        clean = re.sub(r"```(?:json)?", "", raw).strip()
        start, end = clean.find("{"), clean.rfind("}")
        if start != -1 and end != -1:
            clean = clean[start:end + 1]
        data = json.loads(clean)
        return FeedbackResponse(
            overall_score=int(data["overall_score"]),
            summary=data["summary"],
            items=[FeedbackItem(**item) for item in data["items"]],
            generated_by=HF_LLM_MODEL,
        )
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
        logger.error(f"[LLM] Failed to parse feedback JSON: {e}\nRaw: {raw[:300]}")
        raise HTTPException(status_code=502, detail="Failed to parse LLM response")
