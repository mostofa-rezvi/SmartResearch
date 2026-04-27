# CONTEXT — Phase 07: Hybrid Search & Discovery

## Phase Objective
Implement a hybrid recommendation engine that combines semantic content matching (CBF) with behavioral collaborative filtering (CF) to suggest relevant researchers and papers.

## Locked Decisions

### 1. Recommendation Logic (ML Service)
- The core recommender will live in the **Python ML Service** (`ml-service/`).
- It will expose a `POST /recommendations/{userId}` endpoint.

### 2. Hybrid Scorer: RRF
- We will use **Reciprocal Rank Fusion (RRF)** to merge CBF and CF results.
- **Formula**: `score = 1 / (60 + rank_cbf) + 1 / (60 + rank_cf)`.
- **Global Boost**: Incorporate the Neo4j `impactScore` as a multiplier after RRF if high-authority bias is desired.

### 3. Collaborative Filtering (CF)
- **Signal Weighting**: 
    - `SUPPORTS` (Neo4j): Weight 3.0
    - `saved_papers` (Postgres): Weight 2.0
    - `votes` (Postgres): Weight 1.0
- **Cold Start**: If total interaction weight < 5.0, return 100% CBF results.

### 4. Storage & Caching
- **CF Matrix**: Store as a sparse matrix in memory/disk on the ML service, refreshed every 6 hours via background task.
- **Results Cache**: Store final ranked IDs in Redis (`rec:v1:{userId}`) with a **1-hour TTL**.

## Integration Pattern
1. **Frontend**: Requests `/api/recommendations` from Backend.
2. **Backend**: Checks Redis cache. If miss, calls ML Service.
3. **ML Service**: 
    - Fetches User context.
    - Runs CBF (ES kNN).
    - Runs CF (Similarity Matrix).
    - Merges via RRF.
4. **Backend**: Enriches IDs with full metadata (name, title, etc.) and returns to Frontend.
