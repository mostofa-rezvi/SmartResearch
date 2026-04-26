# Research Summary: Week 2 — AI Matching & Collaboration

## Overview
Milestone v1.1 focuses on transforming ResearchBridge from a basic infrastructure to an intelligent collaboration platform. The core challenge is integrating AI-driven matching and real-time feeds into the existing multi-database architecture.

## Key Findings

### Stack Additions
- **AI**: Sentence-BERT (SBERT) + FastAPI + ES 8 Vector Search.
- **Real-time**: Socket.io + Redis Adapter.
- **Analytics**: Neo4j Graph Data Science (GDS).

### Table Stakes
- **Hybrid Search**: Precision (BM25) + Semantic (Vector) discovery.
- **Reputation Scoring**: PageRank-based researcher impact.
- **Real-time Feeds**: Live updates for groups and paper activities.

### Critical Integration Pattern
**The "Triple-Sync" Embedding Loop**: Postgres (Primary) -> Redis Streams -> FastAPI (ML) -> ES 8 / Neo4j (Search/Graph). This ensures all databases stay semantically indexed without blocking the main application.

### Watch Out For
- **UI Latency**: Move all embedding and summarization work to background streams.
- **Socket Scaling**: Use Redis Adapter to prevent "silent failures" in multi-instance Docker setups.
- **Search Precision**: Don't drop BM25; use RRF fusion to keep exact matches relevant.

## Next Steps
- Define requirements based on these categories (Search, Collaboration, AI).
- Update roadmap to include ML service expansion and Socket.io integration.
