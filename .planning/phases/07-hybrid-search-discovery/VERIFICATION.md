# VERIFICATION — Phase 07: Hybrid Search & Discovery

## UAT Criteria

### 1. Hybrid Relevance
- **Scenario**: A user interested in "Quantum Computing" who has "Saved" papers on "Superconductors".
- **Expectation**: Hybrid list should contain both Quantum (CBF) and Superconductor (CF) results.

### 2. Cold Start Handling
- **Scenario**: A brand-new user with zero interactions.
- **Expectation**: Recommendations are successfully returned based on their `research_interests` (CBF) instead of failing or returning empty.

### 3. Performance & Latency
- **Scenario**: 100 concurrent requests to `/api/recommendations`.
- **Expectation**: 
    - Cache Hit: < 50ms.
    - Cache Miss: < 800ms (including ML compute).

### 4. Data Consistency
- **Scenario**: User saves a new paper.
- **Expectation**: Recommendation remains stable for 1hr (cache), then updates after the next CF matrix refresh.

## Status: ⏳ PENDING
Verification will begin after Plan 07-02 is executed.
