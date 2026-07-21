"""Tests for the Hugging Face-powered LLM service (/llm/feedback, /llm/citations).

Network calls to Hugging Face are mocked, so these run offline and without a token.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

import llm_service
from main import app

client = TestClient(app)


# ── 503 when the service is not configured ──────────────────────────────────────

def test_feedback_requires_token(monkeypatch):
    """Without HF_API_TOKEN the endpoint returns HTTP 503, not fabricated data."""
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", False)
    resp = client.post("/llm/feedback", json={"abstract": "Some abstract text."})
    assert resp.status_code == 503


def test_citations_requires_token(monkeypatch):
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", False)
    resp = client.post("/llm/citations", json={
        "title": "A Paper", "authors": ["Jane Doe"], "format": "bibtex",
    })
    assert resp.status_code == 503


# ── Happy path: HF returns well-formed content ──────────────────────────────────

_FEEDBACK_JSON = json.dumps({
    "overall_score": 7,
    "summary": "Solid contribution with clear methodology.",
    "items": [
        {"dimension": d, "score": 7, "comment": "ok", "suggestions": ["a", "b"]}
        for d in ["Clarity", "Novelty & Contribution", "Methodology", "Research Gap", "Impact & Scope"]
    ],
})


def test_feedback_parses_hf_response(monkeypatch):
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", True)
    monkeypatch.setattr(llm_service, "HF_LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
    # HF often wraps JSON in markdown fences — assert we still parse it.
    with patch.object(llm_service, "_hf_chat_sync", return_value=f"```json\n{_FEEDBACK_JSON}\n```"):
        resp = client.post("/llm/feedback", json={
            "abstract": "We present a graph neural network for binding affinity.",
            "title": "GNN for Drug Discovery",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_score"] == 7
    assert len(data["items"]) == 5
    assert data["generated_by"] == "meta-llama/Llama-3.1-8B-Instruct"


def test_feedback_bad_json_returns_502(monkeypatch):
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", True)
    with patch.object(llm_service, "_hf_chat_sync", return_value="not json at all"):
        resp = client.post("/llm/feedback", json={"abstract": "text"})
    assert resp.status_code == 502


def test_citation_strips_code_fences(monkeypatch):
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", True)
    with patch.object(llm_service, "_hf_chat_sync",
                      return_value="```bibtex\n@article{doe2023,title={X}}\n```"):
        resp = client.post("/llm/citations", json={
            "title": "X", "authors": ["Jane Doe"], "year": 2023, "format": "bibtex",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["citation"].startswith("@article")
    assert "```" not in data["citation"]


def test_feedback_upstream_error_returns_502(monkeypatch):
    monkeypatch.setattr(llm_service, "HF_AVAILABLE", True)
    with patch.object(llm_service, "_hf_chat_sync", side_effect=RuntimeError("HF API 503")):
        resp = client.post("/llm/feedback", json={"abstract": "text"})
    assert resp.status_code == 502
