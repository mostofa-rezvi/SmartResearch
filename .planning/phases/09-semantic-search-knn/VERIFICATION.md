# VERIFICATION — Phase 09: Semantic Search & kNN

## UAT Criteria

### 1. Semantic Recall
- **Scenario**: Search for "Deep Learning" on a database with papers titled "Neural Networks".
- **Expectation**: Semantic search (kNN) should find the Neural Network papers even if the specific keyword is missing.

### 2. Hybrid Accuracy
- **Scenario**: Search for a specific researcher name "Dr. Rezvi".
- **Expectation**: Keyword search (BM25) should rank the exact name match as Top 1, regardless of semantic similarity.

### 3. Filtering Precision
- **Scenario**: Search for "AI" filtered by "Institution: MIT".
- **Expectation**: Zero results from non-MIT institutions should appear, even if they have higher semantic scores.

### 4. Latency Target
- **Scenario**: Standard user search.
- **Expectation**: Response time < 200ms (end-to-end).

## Status: ⏳ PENDING
Verification will begin after Plan 09-02 is executed.
