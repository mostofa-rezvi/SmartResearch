"""
LLM Service — Gemini-powered citation generation and writing feedback.

Endpoints:
  POST /llm/citations  — Generate formatted citations (BibTeX/APA/IEEE)
  POST /llm/feedback   — Return structured writing feedback for a paper abstract
"""

import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal

logger = logging.getLogger(__name__)

# ── Gemini client setup ────────────────────────────────────────────────────────
try:
    # pyrefly: ignore [missing-import]
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        GEMINI_AVAILABLE = True
        logger.info("[LLM] Gemini 1.5 Flash initialized")
    else:
        GEMINI_AVAILABLE = False
        logger.warning("[LLM] GEMINI_API_KEY not set — LLM endpoints will return stubs")
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("[LLM] google-generativeai not installed — run: pip install google-generativeai")

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


# ── Helper: call Gemini ────────────────────────────────────────────────────────

async def _call_gemini(prompt: str) -> str:
    """Call Gemini 1.5 Flash and return the text response."""
    if not GEMINI_AVAILABLE:
        raise HTTPException(status_code=503, detail="LLM service not configured. Set GEMINI_API_KEY.")
    try:
        import asyncio
        response = await asyncio.to_thread(_gemini_model.generate_content, prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"[LLM] Gemini call failed: {e}")
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

    prompt = f"""You are an academic citation formatter. {format_instructions[req.format]}

Paper details:
- Title: {req.title}
- Authors: {authors_str}
- Journal/Conference: {req.journal or "Unknown"}
- Year: {req.year or "Unknown"}
- DOI: {req.doi or "Not available"}
- Volume: {req.volume or "N/A"}, Issue: {req.issue or "N/A"}, Pages: {req.pages or "N/A"}

Format: {req.format.upper()}
"""

    citation = await _call_gemini(prompt)
    return CitationResponse(format=req.format, citation=citation, generated_by="gemini-1.5-flash")


@router.post("/feedback", response_model=FeedbackResponse)
async def get_writing_feedback(req: FeedbackRequest):
    """
    Provide structured writing feedback on a paper abstract.
    Returns scored feedback across 5 dimensions.
    """
    prompt = f"""You are an expert academic peer reviewer. Analyze the following research abstract and provide structured feedback.

Title: {req.title or "Not provided"}
Research Area: {req.research_area or "Not specified"}

Abstract:
{req.abstract}

Provide feedback in the following EXACT JSON format (no markdown, just the JSON object):
{{
  "overall_score": <integer 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "items": [
    {{
      "dimension": "Clarity",
      "score": <integer 1-10>,
      "comment": "<specific observation>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }},
    {{
      "dimension": "Novelty & Contribution",
      "score": <integer 1-10>,
      "comment": "<specific observation>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }},
    {{
      "dimension": "Methodology",
      "score": <integer 1-10>,
      "comment": "<specific observation>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }},
    {{
      "dimension": "Research Gap",
      "score": <integer 1-10>,
      "comment": "<specific observation>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }},
    {{
      "dimension": "Impact & Scope",
      "score": <integer 1-10>,
      "comment": "<specific observation>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"]
    }}
  ]
}}"""

    raw = await _call_gemini(prompt)

    # Parse JSON from Gemini response
    import json, re
    try:
        # Strip markdown code fences if present
        clean = re.sub(r"```(?:json)?", "", raw).strip()
        data = json.loads(clean)
        return FeedbackResponse(
            overall_score=data["overall_score"],
            summary=data["summary"],
            items=[FeedbackItem(**item) for item in data["items"]],
            generated_by="gemini-1.5-flash"
        )
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"[LLM] Failed to parse Gemini feedback JSON: {e}\nRaw: {raw[:300]}")
        raise HTTPException(status_code=502, detail="Failed to parse LLM response")
