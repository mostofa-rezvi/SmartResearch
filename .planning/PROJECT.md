# ResearchBridge

## What This Is

ResearchBridge is a Smart Research Collaboration Platform designed to facilitate academic and industrial research through advanced discovery, trust modeling, and real-time collaboration. It provides a unified ecosystem for researchers to share papers, form groups, and discover insights using a multi-database architecture.

## Core Value

Empowering research collaboration through a verifiable trust graph, advanced semantic discovery, and real-time event-driven synchronization across a distributed research ecosystem.

## Shipped: v1.1 — Intelligence & Collaboration (2026-04-26)

**Accomplishments:**
- **AI Discovery Engine**: SBERT-based embedding service for semantic researcher matching.
- **Hybrid Search**: Elasticsearch RRF fusion merging BM25 and kNN search results.
- **Real-Time Collaboration**: Socket.IO project rooms with Yjs CRDT document sync.
- **Trust Analytics**: PageRank and Co-authorship discovery in Neo4j GDS.

## Current Milestone: v1.2 — Week 3 — Frontend, Publication Assistant & Production

**Goal:** Build the Next.js frontend with Authentication, User Profiles, and the Publication Assistant, preparing for production.

**Target features:**
- **Next.js Frontend Scaffold**: Modern React framework setup with a premium design system.
- **Auth & Session Management**: Login, Registration, and JWT-based session persistence.
- **Academic Profiles**: User-facing profile system with research stats and completeness scoring.
- **Publication Assistant**: AI-powered utility for assisting researchers with paper submissions.
- **Production Readiness**: Final performance audits, Dockerization, and deployment prep.

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

### Active

- [ ] **Frontend Scaffold** — Initialize Next.js app with design tokens.
- [ ] **Authentication UI** — Build Login/Register/Social Auth screens.
- [ ] **Academic Profiles** — Implement profile management and stats visualization.
- [ ] **Publication Assistant** — Develop the AI assistant for researcher support.
- [ ] **Production Infrastructure** — Configure Docker, CI/CD, and monitoring.

### Out of Scope

- **Native Mobile Apps** — Focus is currently 100% on the web platform.
- **Payment Processing** — Not required for initial production build.

## Context

ResearchBridge is built as a high-performance mono-repo. The architecture emphasizes data sovereignty and verifiable impact through a "Triple Store" sync strategy (Postgres primary -> ES/Neo4j consumers).

## Constraints

- **Tech Stack**: Node/Express, Next.js, Python FastAPI, PostgreSQL, Redis 7, Neo4j 5, Elasticsearch 8.
- **Timeline**: 3-week target for production-ready MVP.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-Database | Each DB solves a specific "hard problem" better than SQL alone. | ✓ Good |
| Redis Streams | Simpler than Kafka for a 3-week build while providing persistence. | ✓ Stable |
| Mono-repo | Simplifies orchestration and shared typing across services. | ✓ Good |
| Yjs CRDT | Handles complex concurrent document editing without locks. | ✓ Validated |

---
*Last updated: 2026-04-26 after starting Milestone v1.2*
