**Role**: `roles/db.md` + `roles/ml.md`
**Context**: `context/database.md`

**Task**: Update the Trust-Graph (Neo4j) Schema.

**Description**:
Modify the graph relationships that power the ResearchBridge reputation system.

**Requirements**:
1. **Node Definition**: Ensure `(:Researcher)`, `(:Paper)`, and `(:Institution)` nodes are correctly typed.
2. **Relationship Logic**: Implement or update relationships like `[:SUPPORTS]` (for community votes) or `[:MENTORS]` (for supervised students).
3. **Indexing**: Optimize the graph for the TrustRank algorithm's traversal performance.