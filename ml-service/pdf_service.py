"""
PDF Text Extraction micro-service endpoint.
Mounted in the ML FastAPI service at:  POST /library/extract-pdf

Accepts multipart form upload (file=<pdf>).
Uses pdfplumber for text extraction.
Returns: { title, abstract, full_text, page_count, word_count }

The backend Node service proxies requests here.
"""

import io
import re
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/library", tags=["Library"])

# ── Try import pdfplumber; degrade gracefully if not installed ─────────────────
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("[PDF] pdfplumber not installed — run: pip install pdfplumber")


class PdfExtractionResult(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    full_text: str
    page_count: int
    word_count: int
    char_count: int


def _extract_title(pages_text: list[str]) -> Optional[str]:
    """Heuristic: first non-empty line on page 1 under 200 chars, skip headers."""
    if not pages_text:
        return None
    first_page = pages_text[0]
    lines = [l.strip() for l in first_page.split("\n") if l.strip()]
    for line in lines[:10]:
        # Skip lines that look like headers, dates, or email patterns
        if len(line) > 10 and len(line) < 200 and "@" not in line and not re.match(r"^\d", line):
            return line
    return None


def _extract_abstract(full_text: str) -> Optional[str]:
    """Extract text between 'Abstract' and 'Introduction' or 'Keywords'."""
    pattern = re.compile(
        r"(?i)\babstract\b[:\s]*\n?(.*?)(?=\n\s*(?:1\.?\s+)?introduction|\n\s*keywords?|\n\s*index terms?)",
        re.DOTALL
    )
    match = pattern.search(full_text)
    if match:
        abstract = match.group(1).strip()
        # Limit to 1500 chars
        return abstract[:1500] if abstract else None
    return None


@router.post("/extract-pdf", response_model=PdfExtractionResult)
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract text content from an uploaded PDF file.
    Returns structured metadata including title, abstract, and full text.
    """
    if not PDF_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="PDF extraction not available. Install: pip install pdfplumber"
        )

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Size limit: 50MB
    MAX_SIZE = 50 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="PDF exceeds 50MB size limit")

    try:
        pages_text = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)

        full_text = "\n\n".join(pages_text)
        word_count = len(full_text.split())
        char_count = len(full_text)

        title = _extract_title(pages_text)
        abstract = _extract_abstract(full_text)

        logger.info(f"[PDF] Extracted {page_count} pages, {word_count} words from {file.filename}")

        return PdfExtractionResult(
            title=title,
            abstract=abstract,
            full_text=full_text[:100_000],  # cap at 100k chars for response
            page_count=page_count,
            word_count=word_count,
            char_count=char_count,
        )

    except Exception as e:
        logger.error(f"[PDF] Extraction failed for {file.filename}: {e}")
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {str(e)}")
