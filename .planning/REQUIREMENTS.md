# Milestone v1.1 Requirements: AI Matching & Collaboration

## Overview
This milestone builds the intelligence and collaboration layers of ResearchBridge. It introduces semantic matching, hybrid search, and real-time group collaboration.

## 1. AI Matching Engine (AI)
- [ ] **AI-01**: Implement Sentence-BERT (SBERT) embedding service in the FastAPI ML module.
- [ ] **AI-02**: Integrate async embedding generation into the Redis Streams sync bus.
- [ ] **AI-03**: Implement LLM-based abstract summarization for research papers.

## 2. Search & Discovery (SRCH)
- [ ] **SRCH-01**: Implement Hybrid Search in Elasticsearch 8 (BM25 Keyword + kNN Vector).
- [ ] **SRCH-02**: Use Reciprocal Rank Fusion (RRF) to merge keyword and semantic search results.
- [ ] **SRCH-03**: Implement Cypher-based graph pathfinding for researcher discovery (network distance).

## 3. Collaboration Core (COLLAB)
- [ ] **COLLAB-01**: Implement real-time communication using Socket.io with Redis Adapter for scaling.
- [ ] **COLLAB-02**: Build group dashboards for shared research project management.
- [ ] **COLLAB-03**: Implement live activity feeds for group notifications and paper updates.

## 4. Graph Analytics (GRAPH)
- [ ] **GRAPH-01**: Implement PageRank and Betweenness centrality metrics using Neo4j GDS.
- [ ] **GRAPH-02**: Automate the calculation and storage of reputation scores in the Neo4j graph.

## Future Requirements
- **MOBILE-01**: Native mobile app integration.
- **PAY-01**: Subscription and payment processing.

## Out of Scope
- **Blockchain Verification**: Peer review verification via blockchain is deferred to v2.0.
- **Video Conferencing**: Real-time video is out of scope for the MVP.

## Traceability
| Requirement | Phase |
|-------------|-------|
| AI-01 | Phase 6 |
| AI-02 | Phase 6 |
| AI-03 | Phase 7 |
| SRCH-01 | Phase 7 |
| SRCH-02 | Phase 7 |
| SRCH-03 | Phase 9 |
| COLLAB-01 | Phase 8 |
| COLLAB-02 | Phase 8 |
| COLLAB-03 | Phase 8 |
| GRAPH-01 | Phase 9 |
| GRAPH-02 | Phase 9 |
