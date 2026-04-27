# Milestone v1.1 — Project Summary: AI Matching & Collaboration

**Generated:** 2026-04-27
**Purpose:** Team onboarding and project review

---

## 1. Project Overview

Milestone v1.1 focused on building the "intelligence" and "collaboration" engines of the platform. We delivered an SBERT-based embedding service for semantic matching, a hybrid discovery engine combining content and behavioral signals, and a real-time collaborative workspace using CRDTs.

- **Status**: COMPLETED ✅
- **Core Value**: Advanced researcher discovery and seamless, lock-free document collaboration.

## 2. Architecture & Technical Decisions

The architecture evolved into a hybrid intelligence system where behavioral signals from Neo4j and content signals from Elasticsearch are fused via Reciprocal Rank Fusion (RRF).

- **Decision: Hybrid Search (RRF)**
  - **What:** Combined BM25 keyword search with kNN vector search using RRF fusion.
  - **Why:** Merges the precision of keyword matching with the semantic "intuition" of vector embeddings.
  - **Phase:** 07-Hybrid Search & Discovery

- **Decision: CRDT-based Collaboration**
  - **What:** Yjs implementation with Socket.IO transport and 5s debounced Postgres persistence.
  - **Why:** Allows concurrent document editing without the complexity of operational transformation (OT) or manual locking.
  - **Phase:** 10-Collaboration Workspace Backend

- **Decision: TrustGraph PageRank**
  - **What:** Automated daily PageRank execution on Neo4j GDS.
  - **Why:** Quantifies "Research Impact" based on citations and endorsements, preventing reputation spoofing.
  - **Phase:** 08-Graph Intelligence & Trust

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| **06** | AI Foundation (Embeddings) | ✅ DONE | Built the FastAPI SBERT service with SHA256 deduplication caching. |
| **07** | Hybrid Search & Discovery | ✅ DONE | Implemented RRF fusion logic merging content and behavioral recommendations. |
| **08** | Graph Intelligence & Trust | ✅ DONE | Deployed Neo4j GDS algorithms for TrustRank and co-author pathfinding. |
| **09** | Search Quality & Latency | ✅ DONE | Optimized ES kNN with HNSW indexing to achieve sub-200ms latency. |
| **10** | Collaboration Backend | ✅ DONE | Built the real-time sync layer for lock-free document editing and FSM milestones. |

## 4. Requirements Coverage

- ✅ **AI Matching Engine** — SBERT service with 768-dim embeddings operational.
- ✅ **Hybrid Search (RRF)** — BM25 + kNN fusion verified in ES 8.
- ✅ **Graph Intelligence** — Automated PageRank and co-authorship discovery active.
- ✅ **Real-Time Collaboration** — Socket.IO + Yjs sync with Postgres binary storage.
- ✅ **Search Optimization** — Achieved p95 latency < 200ms via HNSW tuning.

**Audit Result:** PASS with accepted tech debt (v1.1-MILESTONE-AUDIT.md)

## 5. Key Decisions Log

| ID | Decision | Rationale | Phase |
|----|----------|-----------|-------|
| D-06 | SBERT `all-mpnet-base-v2` | Superior semantic benchmark scores over smaller DistilBERT models. | 06 |
| D-07 | Cosine Similarity for kNN | Standard metric for sentence embeddings; ensures consistent similarity scores. | 06 |
| D-08 | 5s Debounce Persistence | Prevents database thrashing during rapid concurrent document edits. | 10 |
| D-09 | Finite State Machine (FSM) | Enforces strict rules for milestone transitions (Admin-only completion). | 10 |
| D-10 | Pre-filtering for kNN | Filters domains/institutions *within* the vector search for efficiency. | 09 |

## 6. Tech Debt & Deferred Items

- **Socket.IO Security**: Needs JWT authentication middleware (currently uses open rooms).
- **Yjs Binary Growth**: Long-lived documents accumulate update history; needs periodic snapshotting.
- **PageRank Tuning**: Sensitivity calibration required for large-scale researcher datasets.

## 7. Getting Started

- **ML Service API:** `GET /embed` for vectors, `POST /recommendations` for hybrid lists.
- **Collaboration:** Connect to `sync:update` via Socket.IO for real-time doc streams.
- **Graph Queries:** Use the `GraphService.js` wrappers for Cypher-based discovery.

---

## Stats (v1.1)

- **Timeline:** 2026-04-26 → 2026-04-26 (1 day)
- **Phases:** 5 / 5 Complete
- **Commits:** 45+
- **Files changed:** 35
- **Contributors:** Mostofa Rezvi
