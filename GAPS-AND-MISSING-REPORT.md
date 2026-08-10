# SmartResearch (ResearchBridge / SRCP) — Complete Gaps & Missing-Work Report

**Date:** 2026-08-05
**Prepared by:** Independent code audit (backend, frontend, ML service, infrastructure) + synthesis of the project's own prior reports.
**Method:** The actual source was audited directly — **not** trusting documentation. Findings below were cross-checked against `backend/src`, `frontend/src`, `ml-service`, `k8s`, `docker-compose.yml`, `.github`, and the committed `.env` files. Two headline findings were verified by hand.

> **Important context.** The repo's own docs (`others/PROPOSAL-COMPLIANCE-CHECKLIST.md`, `others/SYSTEM-COMPLETION-REPORT.md`) claim **"all 10 modules at 100%."** This audit finds that claim **overstated**. The backend/DB CRUD surface is genuinely broad and mostly real, but the **flagship AI path does not actually serve AI results at runtime**, a **live credential is committed to git**, and several "done" features are mocks, dead code, or unwired. Treat the "100%" reports as aspirational, not verified.

---

## 0. Verdict at a Glance

| Area | Reality |
|---|---|
| Backend CRUD / API breadth | ✅ Real and broad (most routes do genuine DB work) |
| **AI recommendation pipeline (runtime)** | 🔴 **Broken — always falls back to a non-AI "popular" list** |
| **Semantic/CBF search** | 🔴 **Index never populated → always empty** |
| **Secrets hygiene** | 🔴 **Real Gmail SMTP password committed to git** |
| Forum module (frontend) | 🔴 Parallel **in-memory mock** shipped alongside the real one |
| OAuth login → profile-build flow | 🔴 Stubbed dead-end (no token exchange, no save) |
| Real-time collab / notifications / library backend | 🟡 Real backend, but frontend mounts **fake** panels in places |
| CI / tests-as-a-gate | 🔴 CI runs **no tests**; **zero** frontend tests |
| Monitoring (Prometheus/Grafana/Sentry) | 🔴 Config files exist but **nothing is wired/scraped** |
| Load / performance testing | ❌ Never done (proposal target: 10k concurrent) |
| SSR-for-SEO (a headline proposal rationale) | 🔴 39/41 pages are `"use client"` — effectively no SSR |

**Severity tally (this audit):** ~9 Critical · ~25 Major · ~30 Minor, plus deferred-scope items.

---

## 1. 🔴 CRITICAL — Security & Correctness (fix first)

### 1.1 Live SMTP credential committed to git — **`backend/.env`**
`backend/.env` is **tracked by git** and contains a **real, working Gmail app password**:
```
SMTP_USER=rblannk@gmail.com
SMTP_PASS=<real 16-char Google app password>
```
Anyone with repo access can send email as that account. **Action:** revoke the Google app password *now*, `git rm --cached backend/.env`, purge from history (BFG/filter-repo), confirm `.env` is fully gitignored (root `.env` is; `backend/.env` and `backend/.env.test` are **not**).

### 1.2 Hugging Face token present on disk
Root `.env` (gitignored, so not committed) holds a real-looking `HF_API_TOKEN=hf_satzw…`. Prior reports already flagged it as "shared in plaintext, rotate." Still un-rotated. **Action:** rotate at huggingface.co/settings/tokens.

### 1.3 AI recommendation threshold is mathematically unreachable — **`ml-service/main.py:131` + `recommender/scorer.py:18`**
`rrf_merge(k=60)` scores each item at `1/(60+rank+1)` → **max ≈ 0.033** across both lists. `main.py` then filters with `THRESHOLD=0.533`. **No ML result can ever pass**, so `len(final_results) < 5` is *always* true and the endpoint **always serves the popular-researcher DB fallback** (`main.py:137-156`). The real CF/CBF output is computed then discarded. The threshold was calibrated on cosine (0–1) scores and misapplied to RRF output. **This is the single biggest "the AI doesn't work" bug** — and it directly contradicts the "AI Matching Engine 100%" claim.

### 1.4 CBF semantic index is never populated — **`ml-service/worker.py` unlaunched**
The `profile.created` Redis-stream consumer that encodes profiles into the ES `profiles` index (`worker.py`) is **not started** by `main.py` lifespan (only `behaviour_worker` is), and no compose/k8s service runs it. The ML Dockerfile CMD is `uvicorn main:app` only. So the ES `profiles` index queried at `main.py:121` stays **empty** → `cbf_results` is always `[]`. Combined with 1.3, the "hybrid CF+CBF SBERT" engine yields nothing at runtime.

### 1.5 Degraded mock embeddings ship silently — **`ml-service/ml_model.py:103-116`**
With no local torch and no `HF_API_TOKEN`, `encode()` returns **deterministic MD5-seeded random 768-d vectors** (semantically meaningless), surfaced only via a `degraded` flag callers must remember to check. `.env.example` ships `HF_API_TOKEN=` empty → **default posture is degraded**.

### 1.6 Reputation self-inflation — **`backend/src/services/reputation.service.js:49-61`**
`calculateCitationImpact` writes `impact_score` directly from **client-supplied** citation counts. Via `POST /reputation/calculate` (`auth`-only, `routes/reputation.routes.js:10`) **any logged-in user can inflate their own reputation**. Code even self-labels it `"mock transactional flow"`.

### 1.7 Entire `researchers` router is unauthenticated — **`backend/src/routes/researchers.js`**
No `auth` import at all: `GET /`, `/openalex-sync`, `/:id`, `/:id/works` are fully public, including an **unthrottled external OpenAlex proxy** (abuse/DoS vector).

### 1.8 Analytics exposed to any logged-in user — **`backend/src/routes/analytics.js`**
`/analytics/*` is authn-only with **no role gate**; platform-wide stats are visible to every user. (Prior Architecture Audit flagged E1; unresolved.)

### 1.9 Non-cryptographic OTP — **`backend/src/services/auth.service.js:24,73`**
Email-verification / OTP-login codes use `Math.random()` (predictable), not a CSPRNG.

---

## 2. 🔴 Frontend Mocks & Dead Flows Shipped as "Done"

1. **Mock Forum subsystem** — a *second*, in-memory forum lives beside the real community module:
   - `services/forum-service.ts:23` — threads in a module-level array (wiped on restart).
   - `services/forum-service.ts:38,60` — every author's TrustRank hardcoded `= 50`.
   - `app/api/forum/route.ts:10` — "mock authentication" (only checks a header exists).
   - `app/(dashboard)/forum/page.tsx:25` — "New Thread" button has **no handler**; `ForumThread.tsx:24-31` upvote/reply/share buttons are all dead. The page has **no nav link** → unreachable orphan.
2. **Stubbed OAuth callback → dead profile-build** — `app/api/auth/callback/route.ts:11-14` never exchanges the code (stub comments), always redirects to `/profile/build`, whose `handleSubmit` (`app/profile/build/page.tsx:29-33`) only `console.log`s and **saves nothing**. The entire OAuth path dead-ends.
3. **Fabricated NotificationsPanel** — `components/notifications-panel.tsx` renders hardcoded "Dr. Smith invited you…"; mounted on `workspace/page.tsx:66` and `workspace/document/[id]/page.tsx:21` instead of the real `NotificationBell`.
4. **Hardcoded workspace timeline** — `components/timeline-view.tsx` shows a fixed 40% bar / static milestones; no fetch.
5. **Hardcoded document view** — `workspace/document/[id]/page.tsx:30` title is literally "Research Methodology - Draft"; the `[id]` param is never used to load anything.
6. **Client-side "security" theater** — `services/trustrank-moderation.ts` gates spam with `content.includes('buy now')`; `services/publication-checklist.ts` returns fully hardcoded templates; `app/api/checklist/route.ts` uses `'mock-user'`.
7. **localStorage-only persistence** (should be backend): publication target journal / citations / AI feedback / manual checklist (`PublicationChecklist.tsx`, `CitationGenerator.tsx`, `WritingFeedback.tsx`, `ScimagoJournalFinder.tsx`) and journal "saved papers" per-ISSN (`JournalPapersModal.tsx`, `AllSavedPapersModal.tsx`).
8. **No error state on the main dashboard** — `app/dashboard/page.tsx:60-87` only `console.error`s on fetch failure → stuck in the loading skeleton forever.
9. **`alert()`-driven UX** across admin/onboarding/groups/blogs pages instead of in-app UI (~12 sites).
10. **Personal email hardcoded fallback** — `config/api.ts:12` `OPENALEX_EMAIL … || 'mostofarezvi1@gmail.com'`.

---

## 3. 🟠 Backend Gaps (Major)

1. **Two divergent auth middlewares** — `middleware/auth.js` (`auth`, 401 `{message}`) vs `middleware/auth.middleware.js` (`verifyAuth`, 401 `{error}`); routes split inconsistently → inconsistent error contracts.
2. **`routes/search.js:4`** imports `requireAuth` which **`middleware/auth` does not export** (`undefined`) — the `/doi` route is public and would crash if the middleware were ever attached.
3. **Static publication checklist** — `controllers/publications.controller.js:316-333` returns a hardcoded 12-item array; never persisted/tracked despite the checklist UX.
4. **Hardcoded Scimago seed** — `publications.controller.js:34-47` `SCIMAGO_SEED` (12 journals) used when `data/scimago_journals.json` is missing.
5. **Analytics swallow DB errors** — `controllers/analytics.controller.js:199-201` wraps SQL in `.catch(()=>({rows:[{…zeros}]}))`, returning **fabricated zero metrics** instead of erroring.
6. **Silent email disable** — `services/email.service.js:20` warns (no throw) when SMTP unset; verification/OTP emails **never delivered** but flows appear to succeed. `OTP_LOGIN_ENABLED` also defaults **false** (`config/index.js:31`) → advertised 2FA dormant.
7. **Doc/impl mismatch** — `reputation.service.js:47` comment claims a "Kafka event"; it uses Redis. (Kafka is out of scope; comment is stale.)
8. **Every route mounted twice** — `index.js:94-116` mounts `/api/v1/*` **and** legacy `/api/*`; rate limiting is applied **unevenly** across the two → doubled attack surface.
9. **Pool-level `BEGIN/COMMIT` is non-atomic** (may run on a different pooled connection) — `acceptAnswer`, `register`. `vote()` is a read-modify-write **race** (no tx). Audit hash-chain has a **TOCTOU fork** under concurrent profile updates → permanently breaks `verifyAuditChain`. (Architecture-Audit C1–C4; unresolved.)
10. **`emitEvent` swallows failures** — Redis down = events silently lost, no retry/DLQ (D1). No `unhandledRejection`/`uncaughtException` handlers; no timeout/circuit-breaker on ML calls.

---

## 4. 🟠 ML Service Gaps (Major, beyond §1.3–1.5)

1. **`jobs/graph_rank.py` (Neo4j GDS PageRank / TrustRank) is orphaned** — never imported/scheduled; the community Neo4j image has no GDS plugin. (Real TrustRank is a separate backend JS power-iteration.)
2. **CF state is in-memory, per-process, O(n²)** — `matrix_builder`/`cf_engine` rebuild the full user-similarity matrix on every interaction (`main.py:191-194`, synchronous on the request path); 2+ replicas diverge; state lost on restart; unbounded linear membership scan (`matrix_builder.py:82`).
3. **RRF throws away magnitude** — `scorer.py` uses rank only, discarding ES `_score`/CF weights (compounds §1.3).
4. **New psycopg2 connection per request** (no pool); blocking sync ES client inside async endpoints; `searchSync` indexes even degraded/mock embeddings.
5. **`requirements.txt` gaps** — `scikit-learn`/`scipy` used but not declared (only transitively via sentence-transformers); no `torch` pin; many deps unpinned.
6. **Hardcoded DSN port mismatch** — `main.py:141`, `matrix_builder.py:17`, `graphql_schema.py:23` default `localhost:5434` while compose uses `postgres:5432` (works only because env is always injected).
7. **Heterogeneous IDs** in one recommendation list — CF returns DOIs/`post_`/`user_` ids; DB fallback returns integer profile ids (`main.py:144`).

---

## 5. 🟠 Infrastructure / DevOps / Monitoring

1. **CI runs no tests** — `.github/workflows/ci.yml`: `lint-backend`/`lint-ml` both end `|| echo "…skipped"` (never fail; no `lint` script exists anyway), `docker-build` builds but never pushes. **No jest/pytest gate.**
2. **Monitoring not wired** — `monitoring/prometheus/rules.yaml` + `grafana/dashboards/overview.json` exist, but **no `prometheus.yml` scrape config**, and **no Prometheus/Grafana service** in compose or k8s. Nothing scrapes anything. ml-service exposes **no `/metrics`** at all; backend's `/metrics` is a hand-rolled counter (no latency/error-rate/DB/queue metrics). **No Sentry, no tracing, no request-id.**
3. **Frontend "prod" image runs the dev server** — `frontend/Dockerfile` + `docker-compose.yml:28` run `npm run dev`; no build step.
4. **k8s images never built/pushed** — `deployment.yaml` references `smartresearch/*:latest` (unpinned); no workflow produces them.
5. **k8s base applies placeholder secrets** — `kustomization.yaml` includes `secret.example.yaml` directly (weak defaults: `POSTGRES_PASSWORD: postgres`, `JWT_*: change_me`, `HF_API_TOKEN: hf_xxx_set_me`). `kubectl apply -k k8s/base` deploys these.
6. **No liveness probes; frontend has no probes at all**; **no resource requests/limits** on backend/frontend → undefined scheduling/HPA. HPA exists **only** for ml-service.
7. **StatefulSets unhardened** — Redis no password, Elasticsearch `xpack.security.enabled=false`, single-replica SPOFs, no PVC backups.
8. **No migration versioning** — DB setup replays every `.sql` each run; two `004_*` files with alphabetical-ordering risk; partial-schema risk on mid-file failure.
9. **No DB backup CronJob, no TLS/cert on ingress, no NetworkPolicy** (LEARNINGS recommended ML isolation). Ingress `rewrite-target: /` may strip `/api` prefix and 404 depending on backend base path.
10. **Dockerfiles use `npm install` (not `npm ci`)**, run as root, single-stage; outdated CI actions (`checkout@v3`, etc.), no dependency caching.

---

## 6. 🟠 Testing Gaps

- **Zero frontend tests** — no `.test`/`.spec` under `frontend/src`; no test script. (Proposal wanted Playwright E2E + 50+ tests. Prior v1.2/v1.4 audits *claim* a passing Playwright suite — **contradicted**; none is in CI.)
- **Backend service layer effectively untested** — no tests for `admin, audit, CollaborationService, community, discovery, email, eventBus, groups, library, notification, profile, ProjectService, recommendationService, reputation, socket, storage, token, trust, trustrank`. Backend tests **mock the DB** (unit, not integration) — exactly where the transaction/race bugs in §3.9 hide.
- **Controllers with no test:** admin, blogs, connections, dashboard, discovery, groups, library, notifications, publications, recommendation, reputation, search, ProjectController, users.
- **ML untested modules:** `ml_model` (embedding/HF/mock fallback), `cache.py`, `matrix_builder`, `worker.py`, `graphql_schema`, `pdf_service`. The unreachable-threshold bug (§1.3) is masked because `test_api_recommendations.py` **mocks `rrf_merge`**.
- **No load/performance testing** — proposal targets (dashboard <50ms, semantic search <200ms, 10k concurrent, HPA autoscale) are **entirely unvalidated**.

---

## 7. Feature Completeness vs. Proposal

### Likely-missing or unverified proposal features (resolve against current code)
| Feature | Status | Notes |
|---|---|---|
| **Direct Messaging (DMs)** | ❌ Likely unbuilt | In 40-day plan (Day 25); absent from later status reports. |
| **AMA with professors** | ⚠️ Contradicted | 4thPlan says "recently completed"; 3rdPlan lists Missing (no AMA post type/scheduling). A `gap_features.test.js` exists — verify depth. |
| **Structured Peer Review** | ⚠️ Contradicted | Same split as AMA — reviewer-assign/submit/track flow unconfirmed. |
| **Workspace document version history** | ⚠️ Contradicted | Proposal requires snapshots/diff/history browser; Yjs stores only current binary state. Backend `document_versions.sql` + `VersionHistorySidebar.tsx` exist — verify snapshots actually captured. |
| **SSR for SEO** | 🔴 Effectively false | 39/41 pages `"use client"`; no per-page metadata (only root layout). Directly undercuts a headline proposal rationale. |
| **Behavioral feedback loop → ML** | ⚠️ Partial | 5thPlan claims "verified"; only fires on saves/comments/votes (no distinct read/view endpoint), and §1.3–1.5 mean the loop's output is discarded anyway. |
| **DOMPurify sanitization (proposal Day 28)** | 🟡 Regex sanitizer only | `utils/sanitize.js` is regex-based (its own docstring says use DOMPurify) — XSS-bypassable. CSP allows `'unsafe-inline'`; auth rate-limit is 100/hr despite a "10/hr" comment. |
| **Client-side route/role guards** | ❌ Missing | No `middleware.ts`; admin pages reachable by non-admins client-side. JWT+user in `localStorage` (XSS token-theft risk). |
| **`npm run generate:template`** (README) | ❌ Missing | Documented in README but **no script/source exists**. |
| **Root install flow** (README) | ❌ Wrong | README's `cd SmartResearch && npm install && npm run dev` assumes a **root `package.json` that doesn't exist**. |

### Explicitly deferred / out-of-scope (not "gaps," but not delivered)
Apache **Kafka** (Redis Streams used instead) · **Cloudflare R2 / DO Spaces** (MinIO used) · **Native mobile app** · **API marketplace / public GraphQL** (a `/graphql/v2` engine is mounted but not productized) · **SAML/OIDC institutional SSO** · **B2B analytics dashboards** · **i18n** · **ML fine-tuning** (uses stock `all-mpnet-base-v2`).

---

## 8. Documentation Drift & Report Contradictions

- **"100% complete" reports vs. reality** — `PROPOSAL-COMPLIANCE-CHECKLIST.md` / `SYSTEM-COMPLETION-REPORT.md` mark everything ✅, but the AI runtime (§1.3–1.5), committed secret (§1.1), and mock forum (§2.1) contradict that. The checklist's own honest caveat admits the **frontend was never run through `next build` or a browser**.
- **Cross-report contradictions** to resolve by inspecting code, not trusting any single report: AMA / Peer Review / version history / credential audit-log ("done" in 4thPlan/v1.2 vs "missing" in 3rdPlan); E2E tests ("passed" vs "none in CI"); behavioral feedback loop ("verified" vs "gap"); GraphQL ("delivered" vs "unstarted marketplace item").
- **Stale comments/labels** throughout (Kafka references, `/graphql` vs `/graphql/v2`, 10/hr vs 100/hr rate limit).
- **Repo clutter** — `docker hub.txt`, `scratch/`, `others/`, `.todo/`, committed `__pycache__/` + `.pytest_cache/`, and a `venv/` under `ml-service/`.

---

## 9. Prioritized Remediation Roadmap

**P0 — do immediately (security + "AI actually works"):**
1. Revoke the leaked Gmail app password; remove `backend/.env`/`.env.test` from git + history; rotate the HF token (§1.1–1.2).
2. Fix the recommendation threshold: either normalize RRF or set a reachable threshold, and add a test that does **not** mock `rrf_merge` (§1.3).
3. Launch `worker.py` (or fold profile-encoding into the app) so the ES `profiles` index is populated; fail loudly on degraded embeddings (§1.4–1.5).
4. Gate `researchers` and `analytics` routers with auth/role; remove client-supplied citation writes (§1.6–1.8).

**P1 — correctness & trust:**
5. Delete or wire the mock forum; make OAuth callback exchange the code and `/profile/build` persist; replace fabricated notification/timeline panels (§2).
6. Wrap `register`/`acceptAnswer`/`vote` in real per-connection transactions; fix the audit hash-chain race (§3.9).
7. Add CI that actually runs `jest` + `pytest` and fails on red; add a few frontend tests + one Playwright smoke (§5.1, §6).

**P2 — production readiness:**
8. Wire Prometheus/Grafana (scrape config + services), add ml-service `/metrics`, add Sentry (§5.2).
9. Real prod Dockerfiles (`next build`, `npm ci`, non-root, multi-stage); build/push k8s images; add liveness probes + resource limits + secret management; migration versioning + DB backups (§5).
10. Load test to the proposal's targets (§6).

**P3 — feature closeout:** DMs, AMA, peer review, real version-history browser, DOMPurify + route guards, remove localStorage-only persistence, README fixes (§7).

---

## 10. What Is Genuinely Working (for balance)

Not everything is a gap. Verified-real: most backend controllers/services do real Postgres/ES/Neo4j/ML work (community, groups, connections, notifications, blogs, dashboard, library, discovery, recommendation delegation, Scimago-over-real-journals); admin/moderation routes are correctly role-gated; the email-verification flow, real `NotificationBell`, and `recommendation-feed` fetch live data; SBERT embeddings are real *when* torch or HF is available; the backend `/metrics`, OpenAPI-at-`/api-docs`, and Kustomize k8s manifests exist and render. The bones are solid — the gaps are concentrated in the **AI runtime wiring, secrets hygiene, a handful of shipped mocks, and the ops/testing gate**, not in a wholesale absence of features.

---

*Independent audit generated 2026-08-05. Two headline items (committed SMTP secret; unreachable RRF threshold) were verified by direct inspection; the remainder aggregates a fresh four-layer code audit with the project's own prior reports. Where a prior report and the code disagreed, the code was treated as ground truth.*
