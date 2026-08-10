"""Tests for the agentic RAG service (/rag/chat, /rag/summarize, /rag/paper-qa).

Hugging Face (`_hf_chat_sync`), the embedding model (`get_model`), and
Elasticsearch (`_get_es`) are all mocked, so these run fully offline and
without any token, index, or network.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import rag_service
from main import app

client = TestClient(app)


# ── Fakes ────────────────────────────────────────────────────────────────────────

def _vec(text: str, dim: int = 8) -> np.ndarray:
    """Deterministic tiny embedding — enough for cosine ranking in tests."""
    seed = (sum(ord(c) for c in text) or 1) % (2 ** 32)
    return np.random.default_rng(seed).random(dim)


def _fake_model():
    model = MagicMock()

    def encode(text):
        if isinstance(text, str):
            return _vec(text)
        return np.asarray([_vec(t) for t in text])

    model.encode.side_effect = encode
    return model


def _es_with_hits():
    es = MagicMock()
    es.search.return_value = {
        "hits": {
            "hits": [
                {"_id": "57", "_score": 0.71,
                 "_source": {"title": "Low-resource NLP", "abstract": "We study low-resource languages."}},
                {"_id": "58", "_score": 0.55,
                 "_source": {"title": "Multilingual models", "abstract": "Cross-lingual transfer."}},
            ]
        }
    }
    return es


def _es_empty():
    es = MagicMock()
    es.search.return_value = {"hits": {"hits": []}}
    return es


# ── /rag/chat ─────────────────────────────────────────────────────────────────────

def test_chat_degraded_without_hf(monkeypatch):
    """No HF token → extractive answer + degraded:true, but full response shape."""
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", False)
    with patch.object(rag_service, "get_model", return_value=_fake_model()), \
         patch.object(rag_service, "_get_es", return_value=_es_empty()):
        resp = client.post("/rag/chat", json={"query": "who works on low-resource NLP?"})
    assert resp.status_code == 200
    data = resp.json()
    assert set(data) >= {"answer", "sources", "followups", "used_entity_types", "degraded"}
    assert data["degraded"] is True
    assert isinstance(data["sources"], list)
    assert len(data["followups"]) == 3


def test_chat_returns_sources_with_es_hits(monkeypatch):
    """HF available + ES hits → grounded answer, populated sources, not degraded."""
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", True)
    plan_json = '{"expanded_query":"low resource nlp","entity_types":["paper"],' \
                '"followups":["a?","b?","c?"]}'
    synth = "Researchers focus on low-resource NLP [1]."
    with patch.object(rag_service, "get_model", return_value=_fake_model()), \
         patch.object(rag_service, "_get_es", return_value=_es_with_hits()), \
         patch.object(rag_service, "_hf_chat_sync", side_effect=[plan_json, synth]):
        resp = client.post("/rag/chat", json={"query": "who works on low-resource NLP?", "top_k": 4})
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is False
    assert data["answer"] == synth
    assert len(data["sources"]) >= 1
    src = data["sources"][0]
    assert set(src) >= {"id", "type", "title", "snippet", "score"}
    assert "paper" in data["used_entity_types"]


def test_chat_degrades_when_llm_raises(monkeypatch):
    """HF present but the call throws → still 200 with degraded extractive answer."""
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", True)
    with patch.object(rag_service, "get_model", return_value=_fake_model()), \
         patch.object(rag_service, "_get_es", return_value=_es_with_hits()), \
         patch.object(rag_service, "_hf_chat_sync", side_effect=RuntimeError("HF 503")):
        resp = client.post("/rag/chat", json={"query": "low-resource NLP papers"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is True
    # ES hits still surfaced even though synthesis failed.
    assert len(data["sources"]) >= 1


# ── /rag/summarize ────────────────────────────────────────────────────────────────

_DOCS = [
    {"id": "1", "title": "Graph Neural Networks", "text": "GNNs for molecules and drug discovery."},
    {"id": "2", "title": "Transformers", "text": "Attention mechanisms for sequence modeling."},
]


def test_summarize_shape_with_hf(monkeypatch):
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", True)
    map_arr = '[{"id":"1","summary":"s1"},{"id":"2","summary":"s2"}]'
    reduce_obj = ('{"overview":"An overview.",'
                  '"themes":[{"theme":"ML","summary":"x","papers":["1","2"]}],'
                  '"notable":[{"id":"1","title":"Graph Neural Networks","why":"foundational"}]}')
    with patch.object(rag_service, "_hf_chat_sync", side_effect=[map_arr, reduce_obj]):
        resp = client.post("/rag/summarize", json={"documents": _DOCS, "scope_label": "My Library (2)"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is False
    assert data["doc_count"] == 2
    assert data["overview"] == "An overview."
    assert isinstance(data["themes"], list) and len(data["themes"]) == 1
    assert isinstance(data["notable"], list) and data["notable"][0]["id"] == "1"


def test_summarize_degraded_without_hf(monkeypatch):
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", False)
    resp = client.post("/rag/summarize", json={"documents": _DOCS})
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is True
    assert data["doc_count"] == 2
    assert isinstance(data["themes"], list)
    assert "2 document" in data["overview"]


def test_summarize_caps_docs(monkeypatch):
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", False)
    docs = [{"id": str(i), "title": f"Doc {i}", "text": "text"} for i in range(30)]
    resp = client.post("/rag/summarize", json={"documents": docs})
    assert resp.status_code == 200
    assert resp.json()["doc_count"] == 20


# ── /rag/paper-qa ─────────────────────────────────────────────────────────────────

_PAPER_TEXT = (
    "The experiments used the ImageNet dataset. " * 40
    + "We trained a convolutional network for 90 epochs. " * 40
)


def test_paper_qa_shape_with_hf(monkeypatch):
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", True)
    answer = "They used the ImageNet dataset [1]."
    with patch.object(rag_service, "get_model", return_value=_fake_model()), \
         patch.object(rag_service, "_hf_chat_sync", return_value=answer):
        resp = client.post("/rag/paper-qa", json={
            "question": "What dataset did they use?",
            "title": "A Vision Paper",
            "text": _PAPER_TEXT,
            "top_k": 3,
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is False
    assert data["answer"] == answer
    assert 1 <= len(data["supporting_quotes"]) <= 3
    q = data["supporting_quotes"][0]
    assert set(q) >= {"quote", "score"}


def test_paper_qa_degraded_without_hf(monkeypatch):
    monkeypatch.setattr(rag_service, "HF_AVAILABLE", False)
    with patch.object(rag_service, "get_model", return_value=_fake_model()):
        resp = client.post("/rag/paper-qa", json={
            "question": "What dataset did they use?",
            "text": _PAPER_TEXT,
            "top_k": 2,
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["degraded"] is True
    assert isinstance(data["answer"], str) and data["answer"]
    assert len(data["supporting_quotes"]) >= 1
