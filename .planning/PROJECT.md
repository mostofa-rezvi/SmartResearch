# ResearchBridge

## What This Is

ResearchBridge is a Smart Research Collaboration Platform designed to facilitate academic and industrial research through advanced discovery, trust modeling, and real-time collaboration. It provides a unified ecosystem for researchers to share papers, form groups, and discover insights using a multi-database architecture.

## Core Value

Empowering research collaboration through a verifiable trust graph, advanced semantic discovery, and real-time event-driven synchronization across a distributed research ecosystem.

## Shipped: v1.3 — Gap Closure Phase A: Yjs, Kanban & Templates (2026-06-06)

**Accomplishments:**
- **WS/Yjs Connection**: Real-time collaborative document editor with SocketIOProvider sync.
- **Kanban API Integration**: Next.js kanban board wired to backend endpoints, featuring skeleton loading and optimistic updates with FSM status transition constraints.
- **Templates Seeding**: IEEE, APA, Nature, and ACM templates seeded in public directory, resolving 404 errors.

## Shipped: v1.2 — Week 3 — Frontend, Publication Assistant & Production (2026-04-27)

**Accomplishments:**
- **Frontend & Auth UI**: Next.js dashboard with OTP register, JWT auth, and virtualized Library lists.
- **Publication Assistant**: Fully integrated DOAJ journal recommendation and PDF upload workflow.
- **Production Hardening**: Production-ready Kubernetes (HPA, ingress), Prometheus/Grafana, and E2E Playwright tests.

## Shipped: v1.1 — Intelligence & Collaboration (2026-04-26)

**Accomplishments:**
- **AI Discovery Engine**: SBERT-based embedding service for semantic researcher matching.
- **Hybrid Search**: Elasticsearch RRF fusion merging BM25 and kNN search results.
- **Real-Time Collaboration**: Socket.IO project rooms with Yjs CRDT document sync.
- **Trust Analytics**: PageRank and Co-authorship discovery in Neo4j GDS.

## Current Milestone: v1.4 — Medium Priority: Mentorship Module & Paper History

**Goal:** Implement the mentorship matching and pairing module and track paper reading history.

**Target features:**
- **Mentorship Module**: Establish DB table, Express controller/routes, booking UI, and Neo4j pairing graph sync.
- **Paper Reading History**: Introduce user bookmark/download logs, exposing routes to dynamic dashboard metrics.

## Requirements

### Validated

- ✓ **Core Structure** — Mono-repo scaffolded.
- ✓ **Auth System** — Two-Step OTP and JWT-based authentication.
- ✓ **Multi-DB Foundations** — Connectivity for PostgreSQL, Redis, Neo4j, and Elasticsearch.
- ✓ **Redis Streams Bus** — Replaced mock Kafka emitter with reliable Redis Streams.
- ✓ **Trust Graph Engine** — Neo4j knowledge graph modeling for researchers.
- ✓ **Semantic Discovery** — Elasticsearch indexing and BM25 search.
- ✓ **User Profiles** — Expanded academic profiles with completeness scoring.
- ✓ **ML Service Integration** — FastAPI service wired via Docker.
- ✓ **Infrastructure Hardening** — Production-ready healthchecks and CI/CD skeleton.
- ✓ **Hybrid Search (RRF)** — BM25 + kNN merging in ES 8.
- ✓ **Collaborative Workspace** — Yjs CRDT sync with Postgres binary storage.
- ✓ **Frontend Scaffold** — Next.js frontend UI setup with design tokens.
- ✓ **Authentication UI** — Login/Register screens with session management.
- ✓ **Academic Profiles** — Profile management and stats visualization.
- ✓ **Publication Assistant** — AI assistant for researcher support.
- ✓ **Production Infrastructure** — Docker, CI/CD, and K8s configuration.

### Active

- [x] **WS/Yjs Editor Connection** — Connect @hocuspocus/provider or y-websocket to Express WS gateway.
- [x] **Kanban Integration** — Connect kanban-board.tsx to ProjectService REST API.
- [x] **Templates Seeding** — Save valid templates in public folder.
- [ ] **Mentorship CRUD & UI** — Implement mentorship DB table, Express REST API, booking UI, and Neo4j graph sync.
- [ ] **Reading History Logs** — Implement reading history database tables, GET/POST routes, and dashboard counts.
- [ ] **Security & ML Hardening** — JWT auth on Socket.IO and SBERT threshold calibration.

### Out of Scope

- **Native Mobile Apps** — Focus is currently 100% on the web platform.
- **Payment Processing** — Not required for initial production build.

## Context

ResearchBridge is built as a high-performance mono-repo. The architecture emphasizes data sovereignty and verifiable impact through a "Triple Store" sync strategy (Postgres primary -> ES/Neo4j consumers).

## Constraints

- **Tech Stack**: Node/Express, Next.js, Python FastAPI, PostgreSQL, Redis 7, Neo4j 5, Elasticsearch 8.
- **Timeline**: Dedicated focus on closing outstanding gaps.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-Database | Each DB solves a specific "hard problem" better than SQL alone. | ✓ Good |
| Redis Streams | Simpler than Kafka for a 3-week build while providing persistence. | ✓ Stable |
| Mono-repo | Simplifies orchestration and shared typing across services. | ✓ Good |
| Yjs CRDT | Handles complex concurrent document editing without locks. | ✓ Validated |

---
*Last updated: 2026-06-04 after starting Milestone v1.3*
