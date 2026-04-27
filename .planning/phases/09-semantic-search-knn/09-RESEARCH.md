# RESEARCH — Phase 09: Semantic Search & kNN

## Research Objective
Validate the ES 8.8 hybrid query syntax and identify performance bottlenecks in the vectorization-to-search pipeline.

## 1. Native RRF Syntax (ES 8.8)
- **Constraint**: `knn` and `query` are combined at the top level.
- **RRF Parameters**: `window_size` defaults to 100. This is sufficient for our Top-N discovery.

## 2. Pre-filtering kNN
- **Performance**: Pre-filtering in ES is highly optimized. 
- **Mapping**: Ensure filtered fields (domain, institution) are indexed as `keyword` or `flat_object`.

## 3. Vectorization Latency
- **Profile**: 
    - Network (Backend -> ML): ~10ms.
    - Model Inference (FastAPI): ~50-80ms.
    - ES Search: ~40ms.
- **Total**: ~130ms. Within the 200ms target.

## 4. Cold Start Search
- **Problem**: Querying with a blank search string but filters.
- **Solution**: Fallback to pure BM25/Filter query if no query string is provided (skip kNN).

## Verification Checklist
- [ ] ES Mapping script successfully sets up `dense_vector` for all indices.
- [ ] Hybrid query returns results even for ambiguous terms.
- [ ] Latency benchmark script shows < 200ms for concurrent searches.
