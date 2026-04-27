# RESEARCH — Phase 07: Hybrid Search & Discovery

## Research Objective
Identify efficient implementations for RRF merging and sparse matrix similarity computation to ensure sub-second recommendation latency.

## 1. Reciprocal Rank Fusion (RRF) Implementation
- **Standard RRF**: `score = sum(1 / (k + rank))` for each system. 
- **Refinement**: How to handle items that appear in only one list? (Rank = Infinity, score = 0).
- **Implementation**: A simple Python dictionary-based aggregator is sufficient for merging two lists of 100 items each.

## 2. Sparse User-User Similarity (CF)
- **Problem**: As users/interactions grow, a dense matrix will consume too much RAM.
- **Solution**: Use `scipy.sparse` (CSR format). 
- **Algorithm**: Cosine similarity between user rows in the interaction matrix.
- **Library**: `implicit` or `scikit-learn`'s `cosine_similarity` on sparse matrices. `implicit` is better for large-scale ALS, but for the MVP, `scikit-learn` on CSR is easier to debug.

## 3. Data Ingestion (Postgres/Neo4j -> Python)
- **Postgres**: Use `asyncpg` or `psycopg2` for bulk fetching interaction triplets `(user_id, item_id, weight)`.
- **Neo4j**: Use `neo4j` Python driver to fetch `SUPPORTS` relationships.
- **Optimization**: The "Batch Sync" task should fetch all interactions once, build the matrix, and store the `last_updated_timestamp`.

## 4. Cold Start Fallback
- **Logic**: If `interactions.count(userId) < threshold`:
    1. Query ES for `research_interests` vector (Semantic Search).
    2. Query ES for "Global Popular" (BM25 or Impact Score).
    3. Blend these for the new user.

## Verification Checklist
- [ ] RRF function tested with mock ranked lists.
- [ ] Sparse matrix construction verified from mock Postgres data.
- [ ] Redis cache hit/miss logic confirmed in Python.
