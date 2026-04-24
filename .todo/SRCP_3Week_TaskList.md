# ResearchBridge — 3-Week Production Task List
**Smart Research Collaboration Platform · Mostofa Aminur Rashid · MIT Programme · 2026**

---

## Overview

| Week | Focus | Days |
|------|-------|------|
| Week 1 | Infrastructure, Auth & Core Backend | Days 1–5 |
| Week 2 | AI Matching Engine, Search & Collaboration Core | Days 6–10 |
| Week 3 | Frontend, Publication Assistant & Production Hardening | Days 11–15 |

---

## Week 1 — Infrastructure, Auth & Core Backend

### Day 1 — Project Scaffold & Infrastructure

- [ ] Mono-repo setup: Next.js, Node/Express, Python FastAPI `[DevOps]`
- [ ] Docker Compose: all services wired (Postgres, Redis, Neo4j, Elasticsearch) `[DevOps]` `[Database]`
- [ ] Environment config, secrets management (.env + Vault pattern) `[DevOps]`
- [ ] GitHub Actions CI pipeline skeleton `[DevOps]`

### Day 2 — Auth System

- [ ] JWT + OAuth 2.0 (Google, GitHub) — Node/Express `[Backend]`
- [ ] Refresh token rotation, blacklist in Redis `[Backend]` `[Database]`
- [ ] Rate limiting middleware (express-rate-limit) `[Backend]`
- [ ] Password hashing (bcrypt), email verification flow `[Backend]`

### Day 3 — User Profile & PostgreSQL Schema

- [ ] PostgreSQL schema: users, skills, domains, institutions, goals `[Database]`
- [ ] Profile CRUD API endpoints with validation (Zod/Joi) `[Backend]`
- [ ] File upload (avatar) — S3-compatible (MinIO local, S3 prod) `[Backend]` `[DevOps]`
- [ ] Profile completeness scoring logic `[Backend]`

### Day 4 — Neo4j Graph & Redis Streams Bootstrap

- [ ] Neo4j schema: Researcher → Paper → Topic → Institution nodes `[Database]`
- [ ] Node creation on user registration (graph sync) `[Database]` `[Backend]`
- [ ] Redis Streams topics defined: `profile.created`, `match.request`, `event.behaviour` `[DevOps]`
- [ ] Redis Streams producer in Node.js API (ioredis XADD) `[Backend]`

### Day 5 — Elasticsearch Setup & Indexing

- [ ] ES index mappings: users, papers, projects with `dense_vector` field `[Database]`
- [ ] Index pipeline: on profile save → push to ES via Redis Streams consumer (XREADGROUP) `[Backend]` `[Database]`
- [ ] Basic keyword search endpoint (BM25) `[Backend]`
- [ ] Health-check endpoints across all services `[DevOps]`

### Week 1 Milestones
- All services running in Docker
- Auth fully functional
- User profile stored in Postgres + Neo4j + Elasticsearch

---

## Week 2 — AI Matching Engine, Search & Collaboration Core

### Day 6 — Sentence-BERT Embedding Service

- [ ] Python FastAPI service: `/embed` endpoint (sentence-transformers) `[ML/AI]` `[Backend]`
- [ ] Profile text → 768-dim dense vector, stored in ES + Redis cache `[ML/AI]` `[Database]`
- [ ] Batch embedding job for existing profiles `[ML/AI]`
- [ ] Redis Streams consumer: on `profile.created` → trigger embedding `[ML/AI]` `[Backend]`

### Day 7 — CF + CBF Hybrid Matching Engine

- [ ] Content-Based Filtering: cosine similarity on BERT vectors `[ML/AI]`
- [ ] Collaborative Filtering: user–user matrix from behaviour signals `[ML/AI]`
- [ ] Hybrid scorer: weighted blend CBF + CF (cold-start graceful degradation) `[ML/AI]`
- [ ] Top-N results cached to Redis per user (TTL 1hr) `[ML/AI]` `[Database]`

### Day 8 — TrustRank & Graph Traversal

- [ ] PageRank-variant on Neo4j: credibility flows from verified profiles `[ML/AI]` `[Database]`
- [ ] Endorsement + citation edges written to graph `[Database]`
- [ ] 2nd-degree collaborator traversal query `[Database]`
- [ ] Institutional badge auto-assignment logic `[Backend]` `[ML/AI]`

### Day 9 — Semantic Search & kNN

- [ ] ES kNN search on `dense_vector` field (people, papers, projects) `[Database]` `[Backend]`
- [ ] Unified search endpoint: BM25 + kNN hybrid with RRF fusion `[Backend]`
- [ ] Search filters: domain, skill, institution, availability `[Backend]`
- [ ] Search response < 200ms target — benchmark + tune `[Backend]` `[DevOps]`

### Day 10 — Collaboration Workspace Backend

- [ ] PostgreSQL schema: projects, tasks, milestones, members, versions `[Database]`
- [ ] Workspace CRUD API: create project, invite members, assign tasks `[Backend]`
- [ ] Milestone tracker: status state machine (todo → in-progress → done) `[Backend]`
- [ ] Socket.IO server: rooms per workspace, presence events `[Backend]`
- [ ] Real-time collaborative doc: OT/CRDT-based text sync (Yjs backend adapter) `[Backend]`

### Week 2 Milestones
- Matching engine returning scored results
- TrustRank live on graph
- Semantic search < 200ms
- Workspace CRUD + real-time sockets functional

---

## Week 3 — Frontend, Publication Assistant & Production Hardening

### Day 11 — Next.js Frontend: Auth & Profile

- [ ] Next.js app router scaffold, Tailwind CSS config, layout shell `[Frontend]`
- [ ] Auth pages: sign-up, login, OAuth callback, email verify `[Frontend]`
- [ ] Profile builder UI: skills tags, domain multi-select, bio, paper upload `[Frontend]`
- [ ] SSR for profile pages (SEO-indexable researcher pages) `[Frontend]`

### Day 12 — Discovery & Matching Dashboard

- [ ] Recommendation feed UI: collaborator cards, similarity score badges `[Frontend]`
- [ ] Unified search bar with live suggestions (debounced ES calls) `[Frontend]`
- [ ] Researcher profile page: papers, trust score, shared interests `[Frontend]`
- [ ] Filter sidebar: domain, skill, institution, TrustRank tier `[Frontend]`

### Day 13 — Collaboration Workspace UI

- [ ] Workspace dashboard: task board (kanban), milestone timeline `[Frontend]`
- [ ] Real-time collaborative doc editor (Yjs + Tiptap rich text) `[Frontend]` `[Integration]`
- [ ] Member presence indicators, live cursor via Socket.IO `[Frontend]` `[Integration]`
- [ ] Notifications panel: invites, task updates, mentions `[Frontend]`

### Day 14 — Publication Assistant & Forum

- [ ] DOAJ + Scimago API integration: journal recommender by topic/domain `[Backend]` `[Integration]`
- [ ] Publication checklist + paper templates (downloadable) `[Frontend]` `[Backend]`
- [ ] Forum: threaded posts, upvotes, TrustRank-weighted feed `[Frontend]` `[Backend]`
- [ ] Forum moderation: spam filter using TrustRank threshold gating `[Backend]` `[ML/AI]`
- [ ] Verified institutional badge display across forum + profiles `[Frontend]` `[Backend]`

### Day 15 — Production Hardening & Deployment

- [ ] Kubernetes manifests: per-service Deployments, HPA autoscale for ML pods `[DevOps]`
- [ ] Cloudflare CDN + DDoS rules, WAF config `[DevOps]`
- [ ] Full E2E test suite (Playwright) covering critical flows `[DevOps]` `[Integration]`
- [ ] Load test: 10k concurrent connections benchmark (k6) `[DevOps]`
- [ ] Monitoring: Prometheus + Grafana dashboards, alerting rules `[DevOps]`
- [ ] Production deploy checklist: secrets, DB migrations, smoke tests `[DevOps]`

### Week 3 Milestones
- Full Next.js UI deployed
- Publication Assistant live
- Forum with TrustRank feed
- Kubernetes prod cluster running
- All performance targets validated

---

## Performance Targets Reference

| Metric | Target |
|--------|--------|
| Find a collaborator | < 5 minutes |
| Set up shared workspace | < 2 minutes |
| Find right journal | < 10 minutes |
| Dashboard load time | < 50ms (Redis pre-cached) |
| Semantic search response | < 200ms (ES kNN index) |
| Scale | Horizontal K8s autoscale to 1M users |

---

## Technology Stack Reference

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (React) + Tailwind CSS |
| Real-time | Socket.IO |
| API Gateway | Node.js + Express |
| ML Service | Python + FastAPI |
| Matching | CF + CBF Hybrid |
| Semantic Search | Sentence-BERT |
| Trust Scoring | TrustRank (PageRank-variant) |
| Primary DB | PostgreSQL |
| Graph DB | Neo4j |
| Search Index | Elasticsearch |
| Cache | Redis |
| Message Broker | Redis Streams + Pub/Sub |
| Infrastructure | Docker + Kubernetes |
| CDN / Security | Cloudflare |

---

*ResearchBridge · Mostofa Aminur Rashid · 2026*
