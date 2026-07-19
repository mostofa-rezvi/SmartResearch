# ResearchBridge — AI Suggestions Audit & Completion Report

**Date:** 2026-07-19
**Scope:** End-to-end audit of every AI suggestion / recommendation surface across `ml-service/` (FastAPI), `backend/` (Express), and `frontend/` (Next.js).
**Question asked:** *Are the AI suggestions actually working, and what is missing?*

---

## 1. Executive Summary

**The core AI recommendation engine is genuinely implemented — not faked.** The FastAPI ML service runs real collaborative filtering (sparse cosine similarity), real SBERT embeddings, real Reciprocal Rank Fusion, real Gemini LLM feedback, and a real threshold + fallback pipeline. The backend makes live HTTP calls to it and hydrates results from PostgreSQL. The main collaborator-recommendation feed on the frontend is wired to real endpoints.

**But "working" depends on runtime configuration and there are real defects.** Several AI paths will silently degrade to non-AI or mock behavior in the current setup because required environment variables (`GEMINI_API_KEY`, `ELASTICSEARCH_URL`, `RECOMMENDATION_THRESHOLD`) are **not set** in the `.env` the containers load. There are also two mock/dead code paths, one user-visible mock (search autocomplete), and one data-contract bug in a legacy endpoint.

### Verdict at a glance

| Layer | State |
|-------|-------|
| ML recommender core (CF + CBF + RRF) | ✅ Real, working (config-dependent) |
| ML LLM feedback / citations (Gemini) | ⚠️ Real code, **disabled at runtime** (no API key) |
| SBERT embeddings | ✅ Real, with risky silent mock fallback |
| Backend → ML integration (discovery) | ✅ Real, working |
| Backend legacy `/recommendations` | 🐞 Real call, **broken hydration** |
| Frontend collaborator feed | ✅ Real, working |
| Frontend search autocomplete | ❌ **Mock (user-visible)** |
| Frontend writing feedback UI | ✅ Real (needs ML key) |
| Journal recommender (component/service/route) | 💀 Dead + mock (unused) |
| Dashboard "recommendations" | ⚠️ Real DB query, but keyword match, not AI |
| Analytics "match quality" | ⚠️ Real DB, **hardcoded fallback histogram** |

Legend: ✅ working · ⚠️ works but misleading/degraded · 🐞 buggy · ❌ mock shown to user · 💀 dead code

---

## 2. What IS Working (Real AI)

### 2.1 Collaborative Filtering engine — ✅ REAL
`ml-service/recommender/cf_engine.py`, `matrix_builder.py`

- Builds a real sparse CSR interaction matrix from **PostgreSQL** (`saved_papers` w=2.0, `votes` w=1.0, `reading_history` w=0.5–3.0 by action) **and Neo4j** (`SUPPORTS` relationships, w=3.0). — `matrix_builder.py:30-78`
- Computes real user-user cosine similarity on the sparse matrix. — `cf_engine.py:14-21`
- Aggregates top-10 peer interactions into weighted item scores. — `cf_engine.py:23-51`
- Cold-start handled: returns `[]` for unknown users. — `cf_engine.py:27-29`
- Rebuilds every 15 min via APScheduler + live updates via Redis `event.behaviour` stream worker. — `main.py:52-59`

### 2.2 Content-Based / Semantic embeddings (SBERT) — ✅ REAL (with caveat)
`ml-service/ml_model.py`

- Singleton loads `all-mpnet-base-v2` locally, warms up, encodes to 768-dim. — `ml_model.py:27-57`
- **3-tier fallback:** local SBERT → HuggingFace Inference API → **deterministic hash-based random vectors**. — `ml_model.py:61-95`
- ⚠️ **Caveat:** the tier-3 fallback returns *meaningless* random (but stable) vectors if PyTorch fails to load AND the HF API is unreachable. Semantic search would silently return nonsense with no error surfaced to the caller. See Risk R2.

### 2.3 Hybrid ranking (RRF) — ✅ REAL
`ml-service/recommender/scorer.py` — Textbook Reciprocal Rank Fusion (`1/(k+rank+1)`, k=60) merging CBF + CF lists. — `scorer.py:7-27`

### 2.4 Recommendation endpoint pipeline — ✅ REAL
`ml-service/main.py:85-160` — Cache check → CF → CBF (ES kNN on profile embedding) → RRF merge → threshold filter → popular-researcher DB fallback if `<5` matches → cache set. All real logic.

### 2.5 LLM writing feedback & citations — ✅ REAL CODE
`ml-service/llm_service.py` — Real Google Gemini (`gemini-1.5-flash`) integration. `/llm/feedback` returns structured 5-dimension scored review; `/llm/citations` formats BibTeX/APA/IEEE. **Requires `GEMINI_API_KEY`** — returns HTTP 503 without it (see Gap G1).

### 2.6 Backend integration — ✅ REAL
- `GET /api/v1/discovery/recommendations` → `discovery.service.js:getRecommendationsFromOnboarding` → live `axios.post(${ML_SERVICE_URL}/recommendations/${userId}, {profile_text})`, hydrates `researcher_profiles`, DB fallback on ML failure. — *the correct, working path.*
- `GET /api/v1/discovery/search` → real `POST /embed` → ES kNN + RRF; degrades to keyword search if embedding fails.
- `GET /api/v1/discovery/suggested-collaborators` → real Neo4j 2nd-degree traversal.
- Interaction signals (`bookmark`/`upvote`/`comment`/reading history) fire real `POST /interactions` to feed the recommender in real time.
- `POST /api/v1/publications/feedback` → real proxy to ML `/llm/feedback` (60s timeout).

### 2.7 Frontend (working surfaces) — ✅ REAL
- **Collaborator recommendation feed** (`recommendation-feed.tsx` on `/discovery`) → real `GET /api/v1/discovery/recommendations`, with loading/empty/pagination states.
- **AI Writing Feedback** (`WritingFeedback.tsx`) → real `POST /api/v1/publications/feedback`; validation, loading, error banner, localStorage cache.
- **Publication checklist + PDF extract** → real `/api/v1/publications/checklist` + `/api/v1/library/extract-pdf`.
- **Dashboard recommendations block**, **interest→domain matching**, **edit-interests page** → all fetch real backend endpoints.

---

## 3. What is MISSING / BROKEN

### 🔴 Critical (breaks a feature or shows fake data to users)

**G1 — LLM feedback & citations disabled at runtime (config).**
`GEMINI_API_KEY` is **not present in any `.env`** (root `.env`, `backend/.env`, `.env.example`). `ml-service` loads root `.env` via `env_file: .env` in `docker-compose.yml:50`. Result: `/llm/feedback` and `/llm/citations` return **HTTP 503** ("LLM service not configured"). The AI Writing Feedback UI is real but will only show its error banner until the key is set.
→ **Fix:** add `GEMINI_API_KEY=...` to `.env` and to `.env.example` (documented, empty).

**G2 — Search autocomplete returns mock data (user-visible).**
`frontend/src/app/api/search/suggestions/route.ts:7-14` — `// Mock ES response`, `const mockData = [...]` string-interpolates the query into 3 canned rows (`"${q} in Machine Learning"`, `"Dr. Jane Doe - expert in ${q}"`). This is the **one fake AI surface a user actually sees.** The real hybrid search at `/api/v1/discovery/search` exists but is not called here.
→ **Fix:** proxy this route to the backend `/api/v1/discovery/search` (or a lightweight ES suggest endpoint).

**G3 — Legacy `/api/v1/recommendations` hydration is broken.**
`backend/src/services/recommendationService.js:24-64` assumes ML returns `user_`/`post_`-prefixed IDs, but the working contract uses OpenAlex `researcher_profiles` string IDs. Non-prefixed IDs all fall into the paper branch and are emitted as `type:'paper', title:<rawId>` (comment admits "simplified hydration" / "Fallback to DOI/Title as ID"). Also uses its own raw `new Pool()` instead of shared config.
→ **Fix:** either retire this route (superseded by `/api/v1/discovery/recommendations`) or align hydration to the `researcher_profiles` contract.

### 🟡 Medium (misleading / degraded, not user-broken)

**G4 — Dashboard "recommendations" are not AI.**
`backend/src/controllers/dashboard.controller.js:49-75` — comment: *"we just mock 3 high-quality journals"*. Implementation is a `blogs` table `category ILIKE %interests[0]%` keyword match. Real rows, but no ML/personalization.
→ **Fix:** either wire to ML service or rename field to reflect it's a blog-category match.

**G5 — Analytics "match quality" has a hardcoded fallback histogram.**
`backend/src/controllers/analytics.controller.js:139-146` returns a hardcoded bucket array `[{'0.9-1.0':12}, {'0.8-0.9':34}, ...]` when `reading_history` is empty. Buckets are also derived from `view_count`, not actual ML recommendation scores.
→ **Fix:** replace with a real empty-state; ideally log/telemeter true ML scores.

**G6 — ES config for CBF likely misconfigured in Docker.**
`main.py:107` reads `ELASTICSEARCH_URL` (default `http://localhost:9200`), which is **not set** in `.env`. Inside the container, `localhost` won't reach the ES service. CBF (semantic) half of recommendations silently fails (caught + logged), leaving CF-only results.
→ **Fix:** add `ELASTICSEARCH_URL=http://elasticsearch:9200` to `.env`.

**G7 — `RECOMMENDATION_THRESHOLD` not set.**
`main.py:128` defaults to `0.533` (claimed "calibrated" in v1.5). Not in `.env`, so the calibrated value is implicit only. Confirm the calibration artifact (`ml-service/scripts/calibrate.py`) actually produced 0.533 and pin it in `.env`.

### 🟢 Low (dead code / cleanup)

**G8 — Dead journal recommender stack (mock).** Unused: `frontend/src/components/journal/JournalRecommender.tsx`, `frontend/src/services/journal-recommender.ts` (`Math.random()` impact factors, index-based `relevance`, hardcoded fallback), `frontend/src/app/api/journals/route.ts` (`// SECURITY: Mock authentication check`). Superseded by `ScimagoJournalFinder.tsx` (real). → Delete.

**G9 — Dead duplicate backend service.** `backend/src/services/discoveryService.js` (camelCase) is an orphaned Neo4j-only duplicate of `discovery.service.js`; no imports. → Delete.

**G10 — Legacy `recommendationService.js` calls ML without `profile_text`**, so even if G3 were fixed it only runs CF (CBF skipped per `main.py:99`).

---

## 4. Configuration Gap Table (root cause of most runtime issues)

| Env var | Needed by | In `.env`? | Effect if missing |
|---------|-----------|:---------:|-------------------|
| `GEMINI_API_KEY` | LLM feedback/citations | ❌ | 503 — feedback UI dead (G1) |
| `ELASTICSEARCH_URL` | CBF semantic recs | ❌ | CBF silently skipped, CF-only (G6) |
| `RECOMMENDATION_THRESHOLD` | rec filtering | ❌ | uses implicit 0.533 default (G7) |
| `ML_SERVICE_URL` | backend→ML | ✅ | OK |
| `DATABASE_URL` | ML fallback + matrix | ✅ | OK |
| `NEO4J_URI` / `NEO4J_AUTH` | CF Neo4j source | (verify) | Neo4j interactions dropped if wrong |

---

## 5. Test Coverage (observed)

- **ML:** `test_cf_engine.py`, `test_scorer.py`, `test_api_recommendations.py`, `test_api_interactions.py`, `test_behaviour_worker.py` — core recommender is tested. LLM service (`llm_service.py`) has **no test**.
- **Backend:** `analytics.test.js`, `gap_features.test.js`, `mentorship.test.js`, `reading_history.test.js`, etc. No dedicated recommendation-hydration test (would have caught G3).
- **Frontend:** no `.spec.ts`/`.test.tsx` found for the AI components.

---

## 6. Prioritized Completion Plan (for later)

### Phase 1 — Make real AI actually run (config, ~1 hr)
1. Add `GEMINI_API_KEY`, `ELASTICSEARCH_URL=http://elasticsearch:9200`, `RECOMMENDATION_THRESHOLD=0.533` to `.env` + document in `.env.example`. (G1, G6, G7)
2. Verify Neo4j env vars reach ml-service; smoke-test `/health`, `/recommendations/{id}`, `/llm/feedback`.

### Phase 2 — Kill user-visible fakes (~half day)
3. Point search autocomplete at real `/api/v1/discovery/search`. (G2)
4. Fix or retire legacy `/api/v1/recommendations` hydration. (G3, G10)
5. Rename or ML-wire dashboard "recommendations". (G4)
6. Replace analytics hardcoded histogram with real empty-state. (G5)

### Phase 3 — Hardening (~half day)
7. Guard SBERT tier-3 mock: surface a `degraded: true` flag instead of silent random vectors. (R2)
8. Delete dead code: `JournalRecommender.tsx`, `journal-recommender.ts`, `api/journals/route.ts`, `discoveryService.js`. (G8, G9)
9. Add tests: recommendation hydration (backend), `/llm/feedback` (ML), collaborator feed (frontend).

---

## 7. Risks / Watch-outs

- **R1 (silent degradation):** Multiple AI paths catch errors and fall back to non-AI data (DB popular researchers, keyword search, mock histogram). Good for uptime, but a reviewer/demo may see plausible-but-non-AI output and not realize the ML path failed. Add explicit "source: ml | fallback" flags in responses.
- **R2 (fake embeddings):** `ml_model.py:80-95` hash-random vector fallback can make semantic search return meaningless-but-stable results with zero error. Highest-priority hardening item.
- **R3 (performance):** `cf_engine.py:46` does an O(n) `list().index()` lookup inside a double loop — fine for small data, will not scale.

---

## 8. Bottom Line

**Is the AI working?** The *engine* is real and well-built (CF + SBERT + RRF + Gemini + Redis cache + scheduler). What's missing is not the intelligence — it's (a) **three environment variables** that currently leave the LLM and semantic halves switched off, (b) **one user-visible mock** (search autocomplete), (c) **one buggy legacy endpoint**, and (d) **dead/mislabeled code** to clean up. Close Phase 1 and most "AI not working" symptoms disappear; Phases 2–3 make it honest and demo-safe.
</content>
</invoke>
