# ResearchBridge — AI System Completion Report

**Date:** 2026-07-21
**Author:** Engineering (completion pass on `AI-SUGGESTIONS-AUDIT.md`)
**Scope:** Close every gap (G1–G10) and risk (R1–R3) from the AI Suggestions Audit, and **migrate the LLM layer from Google Gemini to Hugging Face**.

---

## 1. Executive Summary

All items in the audit's *Prioritized Completion Plan* (Phases 1–3) are now implemented. The single biggest change requested was **switching the AI provider to Hugging Face**: the LLM writing-feedback and citation engine no longer depends on Google Gemini — it now calls the **Hugging Face Inference Providers** router (OpenAI-compatible chat completions), and the semantic-embedding fallback also uses an authenticated Hugging Face endpoint.

The Hugging Face integration was **validated live** against the real API during this work:
- **Chat / LLM** — `meta-llama/Llama-3.1-8B-Instruct` returns well-formed 5-dimension feedback JSON and valid BibTeX citations.
- **Embeddings** — `sentence-transformers/all-mpnet-base-v2` via the router `feature-extraction` pipeline returns real 768-dim vectors.

### Verdict at a glance (after completion)

| Layer | Before | After |
|-------|--------|-------|
| ML recommender core (CF + CBF + RRF) | ✅ config-dependent | ✅ config pinned in `.env` |
| LLM feedback / citations | ⚠️ Gemini, disabled (no key) | ✅ **Hugging Face**, live-validated |
| SBERT embeddings | ✅ risky silent mock | ✅ HF-token fallback + **`degraded` flag** |
| Backend legacy `/recommendations` | 🐞 broken hydration | ✅ delegates to real discovery service |
| Frontend search autocomplete | ❌ user-visible mock | ✅ real hybrid-search proxy |
| Dashboard "recommendations" | ⚠️ mislabeled | ✅ honestly documented (blog match) |
| Analytics "match quality" | ⚠️ fake histogram | ✅ real empty-state |
| Journal recommender (dead) | 💀 dead + mock | ✅ deleted |
| Duplicate discovery service | 💀 orphaned | ✅ deleted |
| Recommendation source visibility | R1 silent | ✅ `source: ml\|fallback\|cache` |
| Fake-embedding visibility | R2 silent | ✅ `degraded: true` surfaced |
| CF O(n²) lookup | R3 slow | ✅ O(n) reverse-map |

---

## 2. The Hugging Face Migration (core of this pass)

### 2.1 LLM writing feedback & citations — `ml-service/llm_service.py`
- **Removed** the `google.generativeai` client and `GEMINI_API_KEY` dependency.
- **Added** a provider-neutral chat call to the HF router:
  `POST https://router.huggingface.co/v1/chat/completions` (OpenAI-compatible).
- Model is configurable via **`HF_LLM_MODEL`** (default `meta-llama/Llama-3.1-8B-Instruct`).
- Same request/response contracts preserved (`/llm/feedback`, `/llm/citations`); `generated_by` now reports the HF model id.
- Robust parsing: strips markdown code fences and isolates the JSON object (LLMs frequently wrap output).
- Error semantics preserved: **HTTP 503** when `HF_API_TOKEN` is unset, **HTTP 502** on upstream/parse failure.
- `requirements.txt`: `google-generativeai` removed.

### 2.2 Embedding fallback — `ml-service/ml_model.py`
- The SBERT 3-tier fallback (local → HF API → mock) now sends the **`HF_API_TOKEN`** and uses the **router `feature-extraction`** endpoint (`HF_EMBEDDING_MODEL`, default `all-mpnet-base-v2`).
- The previous unauthenticated legacy endpoint (which now returns empty) is replaced.

### 2.3 Configuration
Added to `.env` (real token, git-ignored) and `.env.example` (empty placeholder + docs):

```
HF_API_TOKEN=<hugging-face token>
HF_LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
ELASTICSEARCH_URL=http://elasticsearch:9200      # G6
RECOMMENDATION_THRESHOLD=0.533                    # G7
```

> ⚠️ **Security:** The Hugging Face token was shared in plaintext during this task. It lives only in the git-ignored `.env`, never in source or `.env.example`. **Rotate/revoke and reissue it** at <https://huggingface.co/settings/tokens>, then update `.env`.

---

## 3. Gap-by-Gap Resolution

| ID | Gap | Resolution | File(s) |
|----|-----|------------|---------|
| **G1** | LLM disabled (no key) | Migrated to Hugging Face; token wired in `.env`/`.env.example` | `ml-service/llm_service.py`, `.env*` |
| **G2** | Search autocomplete mock (user-visible) | Route now proxies real `/api/v1/discovery/search` (ES kNN + RRF); forwards auth; empty-state on error | `frontend/.../api/search/suggestions/route.ts`, `frontend/src/components/search-bar.tsx` |
| **G3** | Legacy `/recommendations` broken hydration + raw `new Pool()` | Service now **delegates** to `DiscoveryService.getRecommendationsFromOnboarding` (real `researcher_profiles` contract, shared db) | `backend/src/services/recommendationService.js` |
| **G4** | Dashboard "recommendations" mislabeled | Honest code comment: it is a blog-category keyword match (UI already labels "Suggested Blog"); real ML recs live at `/discovery/recommendations` | `backend/src/controllers/dashboard.controller.js` |
| **G5** | Analytics hardcoded fallback histogram | Replaced with real **zero-count empty-state** buckets | `backend/src/controllers/analytics.controller.js` |
| **G6** | `ELASTICSEARCH_URL` unset (CBF silently off) | Set in `.env`; ml-service now `depends_on` elasticsearch | `.env*`, `docker-compose.yml` |
| **G7** | `RECOMMENDATION_THRESHOLD` unset | Pinned to calibrated `0.533` in `.env` | `.env*` |
| **G8** | Dead journal recommender stack (mock, `Math.random()`) | Deleted 3 files | `JournalRecommender.tsx`, `journal-recommender.ts`, `api/journals/route.ts` |
| **G9** | Duplicate orphaned discovery service | Deleted | `backend/src/services/discoveryService.js` |
| **G10** | Legacy path ran CF-only (no `profile_text`) | Fixed by G3 delegation (real path builds `profile_text` → CF + CBF) | `backend/src/services/recommendationService.js` |

## 4. Risk Resolution

| ID | Risk | Resolution |
|----|------|------------|
| **R1** | Silent degradation to non-AI data | `/recommendations` now returns **`source: "ml" \| "fallback" \| "cache"`** |
| **R2** | Fake hash-random embeddings, no error | `MLModel` tracks `source`/`degraded`; `/embed` and `/health` expose **`degraded: true`** when the mock is used; louder warning log |
| **R3** | O(n²) `list().index()` in CF double loop | Precomputed **`idx_to_item` reverse map** — O(n) per request |

---

## 5. Tests Added

- **`ml-service/tests/test_llm_service.py`** — 503-without-token, HF-response parsing (incl. markdown fences), 502 on bad JSON / upstream error, BibTeX fence-stripping. HF network mocked (runs offline).
- **`backend/tests/services/recommendationService.test.js`** — verifies delegation to the discovery service and error propagation (regression guard for G3/G10). ✅ **Passing** (`jest`, 2/2).

---

## 6. Verification Performed

| Check | Result |
|-------|--------|
| HF token validity (`whoami-v2`) | ✅ valid (user `rezvi6`) |
| HF chat completions (Llama-3.1-8B) | ✅ live, returns feedback JSON + BibTeX |
| HF embeddings (router feature-extraction) | ✅ live, 768-dim vectors |
| Endpoint feedback/citation logic vs live API | ✅ passing (assertions on shape) |
| Python `py_compile` (4 changed files) | ✅ all OK |
| Node `--check` (3 changed files) | ✅ all OK |
| Backend jest (new test) | ✅ 2/2 passing |
| Leftover Gemini refs in code | ✅ none (labels updated to provider-neutral) |
| Broken refs to deleted files | ✅ none |

> Full `ml-service` pytest suite was not executed here because the local `venv` interpreter path is broken (points to a missing `D:\Python313`). Recommended: run `pytest` inside the `rb-ml` container or a rebuilt venv — the new test follows the existing `TestClient` conventions and mocks all network I/O.

---

## 7. How to Run (post-change)

```bash
# 1. Ensure .env has a valid HF_API_TOKEN (rotate the shared one first)
# 2. Bring the stack up
docker compose up -d --build

# 3. Smoke-test the AI surfaces
curl http://localhost:8000/health                    # {"degraded": false, "embedding_source": ...}
curl -X POST http://localhost:8000/llm/feedback \
  -H 'Content-Type: application/json' \
  -d '{"abstract":"We present a GNN for binding affinity...","title":"GNN"}'
```

The **AI Writing Feedback** and **Citation Generator** UIs will now return real results instead of an error banner, and the header search autocomplete returns real hybrid-search hits.

---

## 8. Follow-ups (optional, not blocking)

1. **Rotate the Hugging Face token** (shared in plaintext) — highest priority.
2. Add a frontend `.spec.tsx` for the collaborator feed / WritingFeedback (audit §5 noted no frontend AI tests).
3. Consider indexing profiles into Elasticsearch on onboarding so CBF has data to match (CF works today; CBF is only as good as the `profiles` index).
4. Surface the ML `source`/`degraded` flags in the admin analytics UI so demos can distinguish real-AI vs fallback at a glance (R1/R2 are now available in the API).

---

*Generated as part of the AI-suggestions completion pass. Supersedes the "MISSING / BROKEN" sections of `AI-SUGGESTIONS-AUDIT.md`.*
