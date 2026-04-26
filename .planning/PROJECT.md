# ResearchBridge

## What This Is

ResearchBridge is a Smart Research Collaboration Platform designed to facilitate academic and industrial research through advanced discovery, trust modeling, and real-time collaboration. It provides a unified ecosystem for researchers to share papers, form groups, and discover insights using a multi-database architecture.

## Core Value

Empowering research collaboration through a verifiable trust graph, advanced semantic discovery, and real-time event-driven synchronization across a distributed research ecosystem.

## Current Milestone: v1.1 Week 2 — AI Matching Engine, Search & Collaboration Core

**Goal:** Implement the AI-driven matching engine, search infrastructure, and core collaboration features using a Sentence-BERT embedding service.

**Target features:**
- **AI Matching Engine**: Sentence-BERT embedding service for semantic researcher matching.
- **Search Infrastructure**: Enhanced Graph-based search and semantic discovery.
- **Collaboration Core**: Group dashboards, shared paper libraries, and activity feeds.
- **LLM Integration**: Abstract summarization service integration.
- **Trust Modeling**: Automated reputation scoring via Neo4j centrality metrics.

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

### Active

- [ ] **Collaboration UI** — Build the group collaboration and paper sharing interface.
- [ ] **Graph Search** — Implement Cypher-based graph search for discovering researchers via network distance.
- [ ] **LLM Summarization** — Integrate ML service to summarize research paper abstracts.

### Out of Scope

- **Native Mobile Apps** — Focus is currently 100% on the web platform (3-week build).
- **Payment Processing** — Not required for initial production build.

## Context

ResearchBridge is built as a high-performance mono-repo. The architecture emphasizes data sovereignty and verifiable impact through a "Triple Store" sync strategy (Postgres primary -> ES/Neo4j consumers).

## Constraints

- **Tech Stack**: Node/Express, Next.js, Python FastAPI, PostgreSQL, Redis 7, Neo4j 5, Elasticsearch 8.
- **Timeline**: 3-week target for production-ready MVP.
- **Messaging**: Redis Streams must replace the current mock event emitter to ensure reliable state propagation.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-Database | Each DB solves a specific "hard problem" (Search, Speed, Graph) better than SQL alone. | ✓ Good |
| Redis Streams | Simpler than Kafka for a 3-week build while providing necessary persistence for event-driven sync. | — Pending |
| Mono-repo | Simplifies orchestration and shared typing across backend, frontend, and ML services. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 after starting Milestone v1.1*
