# CONTEXT — Phase 09: Semantic Search & kNN

## Phase Objective
Upgrade the research discovery engine to support hybrid search (semantic + keyword) with sub-200ms latency.

## Locked Decisions

### 1. Hybrid Search (RRF)
- **Engine**: Elasticsearch 8.8+
- **Fusion**: Native Reciprocal Rank Fusion (RRF).
- **Structure**:
    ```json
    {
      "query": { "multi_match": { ... } },
      "knn": { "field": "embedding", ... },
      "rank": { "rrf": {} }
    }
    ```

### 2. Filtering Strategy
- **Type**: Pre-filtering (Filtering *within* the kNN query).
- **Fields**: `domain`, `institution`, `skills`, `availability`.
- **Reason**: Ensures kNN results are relevant to hard constraints before ranking.

### 3. Performance Target
- **Latency**: < 200ms for p95.
- **Optimization**: Use `HNSW` index for vectors with `m=16` and `ef_construction=100`.

## Integration Pattern
1. **Frontend**: Passes query string + filters.
2. **Backend**:
    - Calls ML Service `POST /embed` to get vector for query string.
    - Constructs and executes hybrid ES query.
    - Returns merged results.
