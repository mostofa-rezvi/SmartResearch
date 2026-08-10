# Spec — Agentic AI Features (RAG Chat · Volume Summary · Paper QA)

**Status:** ✅ Done (implemented + live-verified 2026-08-05) · **Owner:** Engineering · **Created:** 2026-08-05
**Milestone:** v2.1 — Agentic AI Layer
**Rule #1 (hard):** *Never break any existing feature.* Everything here is **additive** — new files + one-line router registrations only. No existing endpoint, schema column, or UI route is modified in a breaking way. All DB objects use `IF NOT EXISTS`; all LLM paths **degrade gracefully** (retrieval/extractive answer + `degraded:true`) instead of 500-ing.

---

## 0. Goal

Add three AI capabilities on top of the existing stack (HF LLM + SBERT embeddings + Elasticsearch kNN + Postgres), reusing what already exists:

1. **Agentic RAG Chatbot** — conversational search over research entities (papers, researchers, forum posts, journals) with grounded, cited answers and a bounded agentic retrieval loop.
2. **Volume Summary** — map-reduce summarization across a *collection* of papers/journals (whole library, a journal, or a selected set) into themes + overview + notable works.
3. **Paper QA** — question-answering grounded in a single selected paper's full text, with supporting quotes.

### Reuse (no reinvention)
| Need | Existing asset |
|---|---|
| LLM chat | `ml-service/llm_service.py::_hf_chat_sync` (HF router, model via `HF_LLM_MODEL`) |
| Embeddings | `ml-service` `/embed` + `ml_model.get_model().encode` (768-dim) |
| Vector search | ES indices `papers`, `posts`, `users` (`embedding` dense_vector, cosine) |
| Paper text | Postgres `library_items.full_text` / `abstract` |
| Backend→ML proxy | `axios` to `ML_SERVICE_URL`, `envelope()`, `verifyAuth` |
| Frontend API map | `frontend/src/config/api.ts` |

---

## 1. Architecture (data flow)

```
Frontend (chat page / paper panel / library button)
   │  fetchWithAuth (JWT)
   ▼
Backend  /api/v1/assistant/*   (verifyAuth, persistence, scope→doc gathering)
   │  axios → ML_SERVICE_URL
   ▼
ML service  /rag/*   (agentic retrieval + HF LLM synthesis, graceful degrade)
   │
   ├─ ES kNN (papers/posts/users)  ── retrieval
   └─ HF router chat completions   ── synthesis
```

---

## 2. API Contracts (frozen — all layers build against these)

### 2.1 ML service — new file `ml-service/rag_service.py` (router prefix `/rag`, registered in `main.py`)

**`POST /rag/chat`** — agentic RAG.
```jsonc
// request
{ "query": "who works on low-resource NLP?",
  "history": [{"role":"user|assistant","content":"..."}],   // optional
  "top_k": 6,                                                 // optional
  "entity_types": ["paper","researcher","post"] }             // optional; default auto
// response
{ "answer": "…grounded prose with [1][2] citations…",
  "sources": [{"id":"57","type":"post","title":"…","snippet":"…","score":0.71}],
  "followups": ["…","…"],
  "used_entity_types": ["paper","post"],
  "degraded": false }
```
Agentic loop (bounded, ≤2 LLM calls + ≤2 retrieval rounds):
1. **Plan** — one LLM call rewrites/expands the query and picks entity types (heuristic fallback if `HF_API_TOKEN` unset).
2. **Retrieve** — embed query → ES kNN over chosen indices (`users`→researcher, `papers`→paper, `posts`→post); collect sources with snippets. Optional 2nd round if the plan asks for a decomposed sub-query.
3. **Synthesize** — one LLM call answers grounded ONLY in retrieved sources with inline `[n]` citations; if no sources → say so honestly.
4. **Degrade** — if LLM unavailable: return top sources + an extractive answer and `degraded:true` (never 503 the whole chat).

**`POST /rag/summarize`** — map-reduce volume summary.
```jsonc
// request  (backend supplies the docs)
{ "documents": [{"id":"12","title":"…","text":"…(<=3000 chars)…"}], "scope_label": "My Library (14 papers)" }
// response
{ "overview": "…", "themes": [{"theme":"…","summary":"…","papers":["12","9"]}],
  "notable": [{"id":"12","title":"…","why":"…"}], "doc_count": 14, "degraded": false }
```
Caps: ≤20 docs, each truncated ≤3000 chars. Map each doc→mini-summary, reduce→themes/overview. Degrade to extractive theme extraction if no LLM.

**`POST /rag/paper-qa`** — QA over one paper.
```jsonc
// request
{ "question":"what dataset did they use?", "title":"…", "text":"…full text…", "top_k":4 }
// response
{ "answer":"…", "supporting_quotes":[{"quote":"…","score":0.68}], "degraded": false }
```
Chunk text (~1000 chars, 150 overlap) → embed chunks + question → cosine top_k → LLM grounded answer with quotes; degrade to top-chunk extract if no LLM.

### 2.2 Backend — new `routes/assistant.js` + `controllers/assistant.controller.js` + `services/assistant.service.js`
Mounted in `index.js` at **`/api/v1/assistant`** and `/api/assistant` (matches existing dual-mount convention). All routes `verifyAuth`. Responses use `envelope()`.

| Method & path | Body | Behavior |
|---|---|---|
| `POST /assistant/chat` | `{ query, session_id? }` | create/find session → load last ~6 msgs → proxy ML `/rag/chat` → persist user+assistant msgs (sources in jsonb) → `{ session_id, answer, sources, followups }` |
| `GET /assistant/sessions` | — | list caller's sessions (id, title, updated_at) |
| `GET /assistant/sessions/:id/messages` | — | messages for a session the caller owns (403 otherwise) |
| `DELETE /assistant/sessions/:id` | — | delete own session (cascade messages) |
| `POST /assistant/summarize` | `{ scope:"my_library"\|"all"\|"journal"\|"ids", journal?, ids?[] }` | gather ≤20 `library_items` (title, abstract, full_text) per scope from Postgres → proxy ML `/rag/summarize` → cache in `assistant_summaries` → return summary |
| `POST /assistant/paper-qa` | `{ item_id, question }` | fetch `library_items` row (404 if missing) → use `full_text \|\| abstract` → proxy ML `/rag/paper-qa` → return answer+quotes |

`ML_SERVICE_URL` from env (default `http://localhost:8000`). On ML error, return a `200` envelope with `degraded:true` + a helpful message (never cascade a 500 to the UI for chat/summary).

### 2.3 Migration — `backend/migrations/v3_assistant.sql` (idempotent)
```sql
CREATE TABLE IF NOT EXISTS assistant_chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assistant_chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,          -- 'user' | 'assistant'
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_msgs_session ON assistant_chat_messages(session_id, created_at);
CREATE TABLE IF NOT EXISTS assistant_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scope_key VARCHAR(255),
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 Frontend
- `config/api.ts` — add an `assistant` domain (chat, sessions, sessionMessages, summarize, paperQa).
- `app/assistant/page.tsx` — chat page: session sidebar, message thread with citation chips + sources panel, follow-up chips, "New chat". Client component; reuses the existing `fetchWithAuth`/auth-context pattern.
- `components/assistant/VolumeSummary.tsx` + a **"Summarize Volume"** button on the library page.
- `components/library/PaperQAPanel.tsx` — "Ask this paper" panel for a selected library item.
- `components/Navbar.tsx` — add an **"AI Assistant"** nav link (additive, guarded like other authed links).

---

## 3. Phases (execution order)

### Phase 0 — Foundation check (orchestrator)
- Confirm existing features intact (backend `/health` UP; groups/community demo present). ✅ verified live before this work.
- Freeze the contracts in §2. ✅ (this doc).

### Phase 1 — ML RAG service *(Agent 1, Python)*
- `ml-service/rag_service.py` implementing `/rag/chat`, `/rag/summarize`, `/rag/paper-qa` per §2.1.
- Register router in `main.py` (`app.include_router(rag_router)`) — one additive line.
- Reuse `_hf_chat_sync` (import) + `get_model().encode` + ES client. Graceful degrade everywhere.
- Tests: `ml-service/tests/test_rag_service.py` (mock HF + ES; assert shapes, degrade path, citation formatting).

### Phase 2 — Backend Assistant API *(Agent 2, Node)*
- `routes/assistant.js`, `controllers/assistant.controller.js`, `services/assistant.service.js` per §2.2.
- `migrations/v3_assistant.sql` per §2.3.
- Mount in `src/index.js` (two additive `app.use` lines).
- Validation (celebrate) for each body. Tests: `src/tests/assistant.test.js` (mock ML axios + DB).
- Add OpenAPI paths for the new endpoints in `backend/openapi.yaml`.

### Phase 3 — Frontend Assistant UI *(Agent 3, Next.js)*
- `config/api.ts` assistant domain; `app/assistant/page.tsx`; `components/assistant/VolumeSummary.tsx`; `components/library/PaperQAPanel.tsx`; Navbar link.
- Must `tsc --noEmit` clean. Follow existing client-page/auth conventions; read `frontend/AGENTS.md` first.

### Phase 4 — Integration & Verification *(Agent 4 / orchestrator)*
- Apply `v3_assistant.sql` to running Postgres (port 5434).
- Register routers; restart backend (host) + start ML service (`uvicorn main:app`), HF token already in root `.env`.
- Smoke test: `POST /api/v1/assistant/chat` returns grounded answer over the seeded community/papers; `summarize` over library; `paper-qa` over a seeded/library paper.
- Regression: existing endpoints (`/health`, `/groups`, `/community/posts`, `/discovery/feed`, `/publications/feedback`) still 200. Frontend `tsc` clean.
- Update `README.md` (new AI endpoints) + flip this doc's Status to Done.

---

## 4. Non-breaking checklist (enforced per agent)
- [ ] Only NEW files + router-registration lines; no edits to existing endpoint logic.
- [ ] All new DB objects `IF NOT EXISTS`; no `ALTER`/`DROP` on existing tables.
- [ ] LLM/ES failures degrade (`degraded:true`), never 500 the chat/summary.
- [ ] New routes are `verifyAuth`-gated.
- [ ] Existing tests still pass; new tests added.
- [ ] Frontend typechecks; no changes to existing pages except additive Navbar link + library buttons.

---

## 5. Agent plan (how many agents)

**4 specialized agents + orchestrator.** Contracts in §2 are frozen so the three implementation agents run **in parallel** on disjoint directories (no file conflicts); the 4th integrates & verifies.

| Agent | Scope | Directory | Depends on |
|---|---|---|---|
| **1 — ML RAG** | `/rag/*` endpoints + tests | `ml-service/` | contract §2.1 |
| **2 — Backend API** | assistant routes/controller/service + migration + OpenAPI + tests | `backend/` | contract §2.1/§2.2 |
| **3 — Frontend UI** | chat page, paper-QA, volume summary, api map, nav | `frontend/` | contract §2.2 |
| **4 — Integration/QA** | migrate, wire, restart, smoke-test, regression, docs | repo-wide | Agents 1–3 |
| **Orchestrator** | freeze contracts, dispatch, final integration & sign-off | — | — |

---

## 6. Verification matrix (Phase 4 exit criteria)
| Check | Expected |
|---|---|
| `POST /rag/chat` (ML, direct) | `{answer, sources[], followups[]}` shape; degrades w/o HF |
| `POST /api/v1/assistant/chat` | grounded answer + session persisted |
| `POST /api/v1/assistant/summarize` (my_library) | themes + overview |
| `POST /api/v1/assistant/paper-qa` | answer + supporting_quotes |
| ML pytest / backend jest | green (new suites) |
| Frontend `tsc --noEmit` | clean |
| Existing `/health`,`/groups`,`/community/posts`,`/publications/feedback` | still 200 |

---

## 7. Phase 4 — Verification Results (2026-08-05, live stack)

Built by 4 agents (ML / Backend / Frontend / Integration), all **additive**. Verified on the running host stack (backend :5000, ML :8000, dockerized Postgres/Redis/ES/Neo4j/MinIO).

| Check | Result |
|---|---|
| Migration `v3_assistant.sql` applied | ✅ 3 tables created (`assistant_chat_sessions/messages/summaries`) |
| ML `/rag/chat` `/rag/summarize` `/rag/paper-qa` registered | ✅ present in `/openapi.json` |
| ML pytest (new `test_rag_service.py`) | ✅ 8 passed; existing 11 still green (no regression) |
| Backend jest (new `assistant.test.js`) | ✅ 8/8 passed; `node --check` clean |
| Frontend `tsc --noEmit` | ✅ clean |
| `POST /api/v1/assistant/chat` | ✅ 200 — 6 real ES sources, session persisted (id 1, auto-titled) |
| `POST /api/v1/assistant/summarize` (scope=all) | ✅ 200 — doc_count 8, 5 themes, real overview |
| `POST /api/v1/assistant/paper-qa` (item 1) | ✅ 200 — grounded answer + supporting quote from paper text |
| Regression: `/health`, `/groups`, `/community/posts`, ML `/health` | ✅ all 200 (nothing broken) |

### ⚠️ Known runtime limitation (external, not a code defect)
The Hugging Face token is currently returning **HTTP 402 — "you have depleted your monthly included credits."** The retrieval layer (ES kNN, chunking, cosine) works fully; LLM **synthesis** therefore falls back to the built-in **extractive** mode (`degraded:true`) — chat/summary/QA still return real, relevant content grounded in the actual data, never an error. To enable full generative answers, do one of:
1. Add credits / subscribe to HF PRO for the token, **or** supply a different `HF_API_TOKEN` with quota;
2. Point `HF_LLM_MODEL` at a model/provider still within free allowance;
3. Run a local LLM and adapt `_hf_chat_sync`'s endpoint.
Set the token in the ML service env and restart `uvicorn main:app` (keep ES/DB at `localhost` on host).

### Wiring notes
- **Live now:** Navbar → **AI Assistant** (`/assistant`) chat page; Library → **Summarize Volume** button.
- **Ready, not yet mounted:** `components/library/PaperQAPanel.tsx` — drop `<PaperQAPanel itemId={id} title={title}/>` into a library-item view to enable single-paper QA (one-line, deferred to avoid touching the existing library-item layout).
