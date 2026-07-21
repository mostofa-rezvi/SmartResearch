# ResearchBridge — Architecture Audit & Gap Analysis

**Date:** 2026-07-21
**Reference:** `ResearchBridge Project Proposal.pdf` (IIT, University of Dhaka)
**Scope:** Full-system critical audit (backend, ML service, frontend, infra, DevOps). **Apache Kafka excluded per request** (Redis Streams is the async bus).
**Method:** static code mapping of all 3 services + two independent adversarial audits (backend/ML/DevOps and frontend), live inspection of the running stack, and cross-check against `others/PROPOSAL-COMPLIANCE-CHECKLIST.md`.

> **How to read this vs. the compliance checklist.** The compliance checklist answers *"is each proposal feature implemented and does it work end-to-end?"* — and the honest answer is **yes, all 10 modules are functionally implemented and were live-tested.** This document answers a different, harder question: *"is the system architecturally sound, robust, secure, observable, and production-ready?"* — and there the answer is **"functionally complete, but with a real production-hardening gap."** Both are true; they are different lenses.

---

## 1. Executive Summary

**What ResearchBridge is:** a microservices research-collaboration platform — a Next.js frontend, a Node/Express API gateway, and a Python/FastAPI ML service, over four data stores (PostgreSQL, Redis, Elasticsearch, Neo4j) + MinIO object storage, glued by a Redis-Streams event bus. ~99 backend JS files, ~110 frontend TS/TSX files, ~22 ML Python files, 12 migrations, 24 route groups.

**Maturity verdict:**

| Dimension | Rating | Note |
|---|---|---|
| **Feature completeness** (proposal modules) | 🟢 **Complete** | All 10 modules implemented + live-verified (see compliance checklist) |
| **Core AI** (CF+CB, SBERT, HF LLM, TrustRank) | 🟢 **Strong** | Genuinely works; well-designed algorithms |
| **Data-pipeline robustness** | 🔴 **Weak** | Search/graph indices drift in normal operation; depend on a manual `/admin/backfill` |
| **Transaction safety** | 🟠 **At risk** | Several "transactions" are non-atomic (pool-level BEGIN) |
| **Frontend production-readiness** | 🟠 **Mixed** | Real features are wired, but a mock Forum + a fake notifications panel are still live; no SSR/metadata; zero tests |
| **Security hardening** | 🟠 **Baseline** | Good primitives (JWT/rate-limit/helmet) but real gaps (regex sanitizer, CSP `unsafe-inline`, analytics not role-gated) |
| **Observability** | 🟠 **Thin** | `/metrics` is a hand-rolled counter; Prometheus/Grafana not wired |
| **CI/CD & testing** | 🔴 **Weak** | CI runs **no tests**; backend tests mock the DB; **zero** frontend tests |
| **Scalability** | 🟠 **Limited** | CF model is in-process, per-replica, rebuilt on every interaction |

**Bottom line:** This is an impressive, feature-rich build that demonstrates the full proposal. To move from *"demoable"* to *"deployable at scale"* it needs a hardening pass concentrated in five areas: **(1)** remove the remaining frontend mocks, **(2)** make the ES/Neo4j pipelines self-healing (not backfill-dependent), **(3)** fix pool-level transactions, **(4)** make CI actually test, **(5)** externalize the ML model state.

---

## 2. Architecture Overview

```
                       ┌─────────────────────────────────────────────┐
      Browser ───────► │  Next.js frontend (App Router, Tailwind)     │
                       │  Socket.IO client (co-editor, notifications) │
                       └───────────────┬─────────────────────────────┘
                                       │  REST /api/v1  +  WebSocket
                       ┌───────────────▼─────────────────────────────┐
                       │  Node/Express API gateway                    │
                       │  auth · discovery · community · mentorship   │
                       │  library · publications · projects/tasks     │
                       │  admin · analytics · notifications · profiles│
                       │  Socket.IO server (rooms, presence, Yjs)     │
                       └──┬──────┬──────┬──────┬──────┬──────┬────────┘
              Postgres ◄──┘      │      │      │      │      └──► MinIO (PDFs, avatars)
              (txn store)   Redis│  Elasticsearch  Neo4j     
                        (cache + │  (kNN + search) (graph)   
                         Streams)│                           
                                 │  Redis Streams event bus  
                                 │  topics: profile.created, event.behaviour, notification.events
                                 │  workers: searchSync, graphSync, notification (backend)
                                 ▼
                       ┌─────────────────────────────────────────────┐
                       │  Python FastAPI ML service                   │
                       │  Sentence-BERT (all-mpnet-base-v2, 768-dim)  │
                       │  CF (sparse cosine) + CBF (ES kNN) + RRF     │
                       │  Hugging Face LLM (citations, feedback)      │
                       │  APScheduler (matrix rebuild) + behaviour    │
                       │  worker; pdfplumber PDF extraction           │
                       └─────────────────────────────────────────────┘
```

**Tech stack (as-built):** Next.js 15 / React / Tailwind / Socket.IO-client; Node/Express / passport / ioredis / pg / neo4j-driver / @elastic/elasticsearch / AWS SDK v3; Python / FastAPI / sentence-transformers / torch / Hugging Face router; PostgreSQL 15, Redis 7, Elasticsearch 8.8, Neo4j 5-community, MinIO; Docker Compose + Kubernetes (Kustomize).

**Event/data flow (intended):** a user action → REST → Postgres write → `emitEvent()` to a Redis Stream → a worker consumes and syncs ES/Neo4j → ML service reads Postgres/ES for recommendations. **The weak link is that several of these sync paths are incomplete or fire-and-forget (see §4B).**

---

## 3. Module Implementation Status (functional)

All 10 modules are functionally implemented and were live-tested — full per-sub-feature detail is in **`others/PROPOSAL-COMPLIANCE-CHECKLIST.md`**. Summary:

| Module | Functional | Notable production caveat surfaced by this audit |
|---|---|---|
| 1 Registration & Profile | ✅ | Profile **edits don't re-index ES** (search goes stale); JWT in `localStorage` |
| 2 AI Matching | ✅ | CBF kNN targets a `profiles` index the app never creates; CF model is in-process/per-replica |
| 3 Workspace | ✅ | Co-editor aligned + persistence-verified; not multi-browser tested |
| 4 Knowledge Library | ✅ | Inline ES indexing is fire-and-forget (no retry) |
| 5 Forum + TrustRank | ✅ (real community) | A **second, mock forum** is still live in the frontend |
| 6 Mentorship | ✅ | — |
| 7 Publication Assistant | ✅ | — |
| 8 Notifications | ✅ | A **fabricated NotificationsPanel** is still mounted on workspace pages |
| 9 Profile & Credentials | ✅ | Audit hash-chain has a concurrency (TOCTOU) gap |
| 10 Admin & Analytics | ✅ | `/analytics/*` is authn-only (no role gate) |

---

## 4. Critical Gap Analysis (the list to work on)

Severity: 🔴 High (data loss / integrity / security / prod-breaking) · 🟠 Med (degraded correctness / ops blind spot) · 🟢 Low (hygiene).

### A. Remaining mocks / fake data in live paths
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| A1 | **Mock Forum still live** — a second, in-memory, non-persistent forum (wiped on restart) with **fake auth** (accepts any non-empty header) and **hardcoded TrustRank = 50**; parallel to the real community stack | `frontend/services/forum-service.ts:23,38`, `app/api/forum/route.ts:10`, `app/(dashboard)/forum/page.tsx` | 🔴 |
| A2 | **Fabricated NotificationsPanel** ("Dr. Smith invited you…", "2 hours ago") mounted on both workspace pages | `frontend/components/notifications-panel.tsx:10-12`, used in `app/workspace/page.tsx`, `workspace/document/[id]/page.tsx` | 🔴 |
| A3 | **Dead mock checklist** route + service using `'mock-user'` (no callers; real checklist hits the backend) | `frontend/app/api/checklist/route.ts:12`, `services/publication-checklist.ts` | 🟠 |
| A4 | **Dead `auth.service.js`** (OTP via `Math.random`, `profile.created` emitter) — unwired; the real OTP path uses `crypto.randomInt` in `auth.controller.js` | `backend/src/services/auth.service.js:24,73` | 🟢 |
| A5 | Fake team on the public About page (marketing placeholder) | `frontend/app/about/page.tsx:92` | 🟢 |

### B. Data-pipeline & sync robustness — **the biggest structural gap**
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| B1 | **ML CBF queries an ES index the app never creates.** `/recommendations` runs kNN against `index="profiles"`, but `initIndices` only creates `users/papers/projects/posts`. On a fresh deploy CBF silently returns `[]` → recommendations degrade to CF + popularity fallback. (It "works" today only because a one-off seed script populated `profiles`.) | `ml-service/main.py:121` vs `backend/src/config/elasticsearch.js` | 🔴 |
| B2 | **Profile edits never re-index ES.** `profile.created` is emitted on register + backfill only; editing bio/interests does not re-emit or re-index, so the `users` search index goes stale | `backend/src/controllers/profile.controller.js` (no emit) | 🔴 |
| B3 | **Neo4j only gets a bare node on register.** COLLABORATES / AUTHORED / Paper edges are created **only** by `/admin/backfill`, so the graph (and TrustRank/suggested-collaborators) drifts out of date in normal use | `backend/src/workers/graphSync.worker.js`, `routes/admin.js` backfill | 🔴 |
| B4 | **Inline ES indexing is fire-and-forget** (posts, library items) — a momentary ES blip means the doc is missing from search **forever** (no retry, not routed through the durable stream+worker) | `backend/src/services/community.service.js` `_indexPostSemantically`, `library.service.js` `_indexItem` | 🟠 |
| B5 | **Live data is sparse** — `users` ES index has 6 docs, `papers` 8, `projects` 0; Neo4j ~6 nodes. Search/matching quality is only as good as the (currently thin) indexed corpus | live `_cat/indices`, Neo4j count | 🟠 |
| B6 | Deeper Neo4j **co-authorship** graph (real publication data → Paper/AUTHORED) is only seeded from shared library papers | `routes/admin.js` backfill | 🟢 |

### C. Transaction safety & data integrity
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| C1 | **Pool-level `BEGIN/COMMIT` is not atomic.** `db.query('BEGIN')` may run on a *different* pooled connection than the following writes → intermediate writes aren't in the transaction. Affects `acceptAnswer` and `register` | `backend/src/config/db.js`, `community.service.js` acceptAnswer, `auth.controller.js` completeOnboarding | 🔴 |
| C2 | **`vote()` has a read-modify-write race** (SELECT→INSERT/UPDATE→recount→reputation) with no transaction → concurrent votes double-count or lose updates | `backend/src/services/community.service.js` vote | 🔴 |
| C3 | **Reputation split across two unrelated stores** — `invited_user_profiles.impact_score` vs `users.reputation_points`+`reputation_events`; non-invited users' vote reputation updates a row that may not exist | `reputation.service.js` | 🟠 |
| C4 | **Audit hash-chain TOCTOU** — reads latest `entry_hash` then inserts in a separate statement with no lock; two concurrent profile updates fork the chain and permanently break `verifyAuditChain` | `backend/src/services/audit.service.js` logProfileChange | 🟠 |
| C5 | Missing FK: `community_posts.accepted_comment_id` has no `REFERENCES comments(id)` | `migrations/v2_completion.sql` | 🟢 |

### D. Error handling & resilience
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| D1 | **`emitEvent` swallows failures** — if Redis is down the event (profile.created, behaviour) is lost with no retry; downstream ES/Neo4j/ML never learn about it | `backend/src/services/eventBus.service.js` | 🔴 |
| D2 | **No dead-letter / retry** in the sync workers (graphSync/searchSync just log); failed messages sit in the PEL, never deterministically retried | `graphSync.worker.js`, `searchSync.worker.js` | 🟠 |
| D3 | **ML `/interactions` calls have no timeout** on the request hot path → a hung ML service piles up sockets; no circuit breaker anywhere | `community.service.js`, `discovery.service.js` interaction posts | 🟠 |
| D4 | **No process-level safety net** — `index.js` never registers `unhandledRejection`/`uncaughtException` handlers | `backend/src/index.js` | 🟠 |
| D5 | No retry/backoff on HF embedding/LLM calls (single attempt → mock/502) | `ml_model.py`, `llm_service.py` | 🟢 |

### E. Security hardening
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| E1 | **`/analytics/*` is authn-only, no role gate** — aggregate platform stats (growth, collaboration, publications) exposed to any logged-in user | `backend/src/routes/analytics.js` | 🔴 |
| E2 | **Regex-based sanitizer**, not a real HTML sanitizer (its own docstring says use `sanitize-html`/DOMPurify) — bypassable by malformed/mutation XSS | `backend/src/utils/sanitize.js` | 🟠 |
| E3 | **CSP allows `'unsafe-inline'` scripts**, defeating much of helmet's XSS protection | `backend/src/index.js` helmet config | 🟠 |
| E4 | **Auth rate limit is 100/hour** though the comment says "10/hour" — brute-force window 10× wider than intended | `backend/src/middleware/rateLimit.js` | 🟠 |
| E5 | **No client-side route/role guards** — no `middleware.ts` / dashboard layout; **admin pages have no role guard** (logged-out/non-admin users reach them, just see failed fetches) | `frontend` (no `middleware.*`) | 🟠 |
| E6 | **JWT + user stored in `localStorage`** (readable by injected scripts → XSS token theft) | `frontend/context/AuthContext.tsx` | 🟠 |
| E7 | Two divergent auth middlewares (`auth` vs `verifyAuth`) coexist; routes mix them | `middleware/auth.js`, `auth.middleware.js` | 🟢 |
| E8 | Hardcoded credential **defaults** in ML service (`postgres:postgres`, `neo4j/password`) — silently used if env unset | `ml-service/matrix_builder.py`, `main.py` | 🟠 |
| E9 | Dynamic `UPDATE users SET ${updates.join()}` — safe only if the column list is a strict allowlist (verify) | `backend/src/controllers/profile.controller.js:139` | 🟢 |
| E10 | **Rotate the Hugging Face token** that was shared in plaintext earlier | `.env` (git-ignored) | 🔴 |

### F. Frontend architecture
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| F1 | **"Next.js SSR for SEO" is effectively false** — 39/41 pages are `"use client"`; even public marketing pages fetch client-side | `frontend/app/**/page.tsx` | 🟠 |
| F2 | **No per-page metadata** — `export const metadata` exists only in the root layout; blog posts/profiles/researchers have no unique title/OG tags | `frontend/app/layout.tsx` only | 🟠 |
| F3 | **Zero frontend tests** — no `.test/.spec`, no runner, no `test` script | `frontend/package.json` | 🟠 |
| F4 | **Crash-prone / missing states** — the mock forum page has no error handling (infinite spinner on failure); `ForumThread` assumes `replies` is always an array; no route-level `error.tsx`/`loading.tsx` | `app/(dashboard)/forum/page.tsx`, `components/forum/ForumThread.tsx` | 🟠 |
| F5 | **Almost no a11y** — only ~3 `aria-*`/`role` occurrences app-wide; icon-only buttons lack accessible names | `frontend/src` | 🟢 |
| F6 | **Stale `.next/` build** references a deleted `/api/journals` route → can break a clean `next build`; `next.config.ts` uses `as any`/`@ts-ignore` and a malformed `devIndicators` | `.next/`, `frontend/next.config.ts` | 🟠 |
| F7 | Response-shape inconsistency — real backend `{success,data}` vs mock routes returning bare arrays/`{templates}` | `api/forum`, `api/checklist` | 🟢 |

### G. Observability & monitoring
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| G1 | **`/metrics` is a hand-rolled global counter** (uptime/RSS/heap/one request total) — no per-route latency histogram, no status/error-rate, no DB/queue metrics; unusable for SLOs | `backend/src/index.js` /metrics | 🟠 |
| G2 | **Prometheus not wired** — `monitoring/prometheus/` has only `rules.yaml`; no `prometheus.yml` scrape config; nothing scrapes `/metrics` | `monitoring/` | 🟠 |
| G3 | **Grafana dashboard is an orphan JSON** — no provisioning/datasource, not in compose/k8s | `monitoring/grafana/dashboards/overview.json` | 🟢 |
| G4 | Inconsistent logging (`morgan('dev')` + pino), no request-id/correlation, no tracing (OpenTelemetry) | `backend/src/index.js`, `utils/logger.js` | 🟢 |

### H. ML service scalability
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| H1 | **CF matrix + user-similarity recomputed on every interaction** (debounced ≥10/60s) — full O(n²) rebuild; won't scale past small data | `ml-service/main.py`, `matrix_builder.py`, `workers/behaviour_worker.py` | 🔴 |
| H2 | **In-memory, per-process CF state** — module-level singletons; 2+ ML replicas diverge; all state lost on restart until the 15-min rebuild | `ml-service/main.py`, `matrix_builder.py` | 🔴 |
| H3 | **`graph_rank.py` (Neo4j GDS PageRank) is dead** — Neo4j community image has no GDS plugin and nothing schedules it; the real TrustRank is the backend JS power-iteration | `ml-service/jobs/graph_rank.py`, `docker-compose.yml` | 🟠 |
| H4 | **New psycopg2 connection per request** in the DB fallback (no pool) → connection exhaustion under load | `ml-service/main.py` | 🟠 |
| H5 | **Blocking (sync) ES client inside an async endpoint** + deprecated `body=` → stalls the event loop | `ml-service/main.py` | 🟠 |
| H6 | `searchSync` indexes even when embeddings are the `degraded` mock (garbage vectors) — doesn't check the flag | `searchSync.worker.js`, `ml_model.py` | 🟢 |

### I. CI/CD & testing
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| I1 | **CI runs no tests** — only `lint-backend`, `lint-ml`, `docker-build`; the jest + pytest suites are never executed as a gate | `.github/workflows/ci.yml` | 🔴 |
| I2 | **Lint can't fail** (`npm run lint \|\| echo …`, and there's no `lint` script) | `.github/workflows/ci.yml`, `backend/package.json` | 🟠 |
| I3 | **Backend tests mock the DB** (unit, not integration) — the exact place the §C pool-transaction bugs hide is untested | `backend/src/tests/*` | 🟠 |
| I4 | **No image publish / no deploy / no e2e**; `npm install` (not `npm ci`), no caching, outdated action versions | `.github/workflows/ci.yml` | 🟠 |
| I5 | **No dependency scanning** (Dependabot) or SAST (CodeQL) | `.github/` | 🟢 |

### J. DevOps / deployment
| # | Gap | Evidence | Sev |
|---|---|---|:--:|
| J1 | **No migration version tracking** — `setup-db.js` replays every `.sql` each run; ordering is alphabetical (two `004_*` files); a mid-file failure leaves a partial schema | `backend/scripts/setup-db.js`, `run-migration.js`, `migrations/` | 🔴 |
| J2 | **No K8s TLS/ingress-cert, no DB backups (CronJob), no NetworkPolicy** | `k8s/` | 🟠 |
| J3 | **No load/performance testing** (proposal timeline task 19) — no k6/artillery/locust; BERT latency, Redis hit-rate, HPA autoscale unvalidated | repo | 🟠 |
| J4 | **Email requires SMTP** — degrades to log-only when unset (so notifications/OTP emails aren't delivered in the current config) | `email.service.js` | 🟢 |

---

## 5. Prioritized Action List

**P0 — correctness / security / data-loss (do first)**
1. **B1** Point ML kNN at the real `users` index (or create+populate `profiles` in `initIndices`) so content-based recs don't silently degrade.
2. **C1/C2** Fix pool-level transactions (check out a client) and make `vote()` an idempotent `INSERT … ON CONFLICT` inside one tx.
3. **B2/B3** Emit `profile.updated` + graph events on connection-accept/publish and consume them in the workers, so ES/Neo4j stay in sync **without** `/admin/backfill`.
4. **E1** Add `requireRole(['admin','super_admin'])` to `/analytics/*`.
5. **E10** Rotate the Hugging Face token.
6. **A1/A2** Remove (or wire to the backend) the mock Forum + NotificationsPanel.

**P1 — robustness / production-readiness**
7. **D1/D2** Make event emission durable (outbox or fail-loud) and route all ES indexing through the stream+worker with a retry/DLQ.
8. **I1/I2/I3** Make CI run `npm test` + `pytest` against ephemeral pg/redis/es (testcontainers); add a real `lint` gate.
9. **H1/H2** Move CF matrix rebuild to scheduled-only + externalize model/similarity state (shared store) so replicas agree.
10. **J1** Adopt a real migration runner with a versions table + checksums.
11. **E2/E3/E4/E5/E6** Swap in `sanitize-html`; drop CSP `unsafe-inline`; fix the auth rate limit; add a `middleware.ts` route/role guard; move JWT to an httpOnly cookie.

**P2 — observability / scale / quality**
12. **G1/G2/G3** Replace `/metrics` with `prom-client` (route-labeled histograms) and wire Prometheus scrape + Grafana provisioning.
13. **H4/H5** Pool the ML DB connection; use `AsyncElasticsearch`.
14. **F1/F2** Convert public pages to Server Components + per-page `generateMetadata` (deliver the promised SSR/SEO).
15. **F3** Add a frontend test runner (Vitest + RTL) covering auth/`fetchWithAuth`/data components.
16. **J3** Add a load-test suite (k6) for BERT latency + cache hit-rate + HPA.

**P3 — hygiene / cleanup**
17. **A3/A4** Delete dead code (mock checklist route/service, `auth.service.js`).
18. **F6** `rm -rf .next` + clean `next.config`; fix stale build validator.
19. **C5** Add the missing FK; **I5** enable Dependabot + CodeQL; **J2** add TLS/backups/NetworkPolicy; **J4** configure SMTP.
20. **H3** Remove or properly wire (GDS + schedule) the dead `graph_rank.py`.

---

## 6. What's Genuinely Solid (to keep)

- **The AI core is real and well-built:** sparse-cosine CF + ES-kNN CBF + RRF fusion + calibrated threshold + popularity fallback; real 768-dim SBERT; Hugging Face LLM for citations/feedback; an **operational** PageRank TrustRank (backend power-iteration); SBERT-based semantic mentor matching and abstract→journal matching.
- **Clean layering** (routes → controllers → services), a standard response envelope, Joi validation, `pino` structured logging, a Redis-Streams event bus with consumer groups, and a solid deep health check.
- **Verifiable credential audit log** (DB append-only trigger + SHA-256 hash chain) — a genuinely nice, tamper-evident design.
- **Real-time collaboration** (Yjs co-editor aligned to the backend protocol, persistence-verified) and **live notification delivery** (fixed).
- **Full container + K8s story** (Kustomize, DB StatefulSets, HPA) and a **served OpenAPI** spec.
- **148 automated tests green** (backend 134 + ML 23... note: unit-level; see §I).

---

## 7. Recommended Roadmap (phased)

| Phase | Theme | Items | Est. |
|---|---|---|---|
| **1. Correctness** | Stop silent data loss/drift | B1, B2, B3, C1, C2, D1, E1, E10 | ~1 week |
| **2. Trust the pipeline** | Durable sync + CI gate | D2, I1–I3, J1, A1, A2 | ~1–2 weeks |
| **3. Harden** | Security + scale | E2–E6, H1, H2, H4, H5 | ~1–2 weeks |
| **4. Operate** | Observability + SSR/tests | G1–G3, F1–F3, J2, J3 | ~1–2 weeks |
| **5. Polish** | Cleanup | A3, A4, C5, F6, H3, I5, J4 | ~2–3 days |

---

*Generated from static code mapping of all three services + infra, two independent adversarial audits, and live inspection of the running Docker stack. This document is a production-readiness gap analysis; per-feature implementation status is in `others/PROPOSAL-COMPLIANCE-CHECKLIST.md`. Apache Kafka excluded per request.*
