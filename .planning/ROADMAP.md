# Roadmap: Milestone v1.1

## Phase 6: AI Foundation & Embedding Service
- **Goal**: Setup the ML service for semantic embeddings and async sync.
- **Requirements**: AI-01, AI-02
- **Success Criteria**:
    1. FastAPI service returns SBERT embeddings for provided text.
    2. Redis Streams events (profile/paper updates) trigger embedding generation.
    3. Generated embeddings are successfully stored in Elasticsearch `dense_vector` fields.

## Phase 7: Hybrid Search & Discovery
- **Goal**: Implement advanced search using both keyword and semantic intent.
- **Requirements**: SRCH-01, SRCH-02, AI-03
- **Success Criteria**:
    1. Search returns relevant results for natural language queries (Semantic Search).
    2. Reciprocal Rank Fusion (RRF) merges BM25 and kNN results into a unified relevant list.
    3. Research papers display LLM-generated abstract summaries in search results.

## Phase 8: Real-Time Collaboration Core
- **Goal**: Build the WebSocket infrastructure and shared dashboards.
- **Requirements**: COLLAB-01, COLLAB-02, COLLAB-03
- **Success Criteria**:
    1. Real-time messages are synchronized across multiple server instances via Redis Adapter.
    2. Group dashboards allow members to manage shared paper libraries.
    3. Activity feeds push live notifications for new papers and group events.

## Phase 9: Graph Intelligence & Trust
- **Goal**: Implement reputation scoring and network discovery.
- **Requirements**: GRAPH-01, GRAPH-02, SRCH-03
- **Success Criteria**:
    1. Neo4j GDS calculates PageRank and Betweenness centrality for all researchers.
    2. Reputation scores are stored and used as boost factors in discovery.
    3. "Path to Connection" discovery shows how researchers are linked through co-authorship.
