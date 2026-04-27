# VERIFICATION — Phase 08: Graph Intelligence & Trust

## UAT Criteria

### 1. PageRank Credibility
- **Scenario**: A senior researcher with many citations and supports.
- **Expectation**: Their `impactScore` should be significantly higher than a new user with zero interactions.

### 2. Collaborator Discovery
- **Scenario**: User A has co-authored with User B. User B has co-authored with User C.
- **Expectation**: User C should appear in User A's "Suggested Collaborators" list (2nd-degree).

### 3. Institutional Badges
- **Scenario**: User updates profile to MIT. MIT node exists in Neo4j.
- **Expectation**: `isVerifiedInstitutional` is set to `true` on the Researcher node in Neo4j.

### 4. Graph Projection Performance
- **Scenario**: Running PageRank on a graph with 10k nodes and 100k edges.
- **Expectation**: Job completes in < 30 seconds.

## Status: ⏳ PENDING
Verification will begin after Plan 08-02 is executed.
