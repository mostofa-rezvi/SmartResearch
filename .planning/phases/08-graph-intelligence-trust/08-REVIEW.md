# REVIEW — Phase 08: Graph Intelligence & Trust

## Review Summary
The implementation successfully integrates Neo4j GDS for PageRank and multi-hop co-authorship traversal. The synchronization of institutional badges via the worker pattern is robust, but there are potential performance issues in the PageRank orchestration and query safety.

## Finding 1: Lack of Transaction Management in PageRank (Severity: MEDIUM)
- **File**: `ml-service/jobs/graph_rank.py`
- **Issue**: The `run_pagerank` method drops and creates projections in separate `session.run` calls without a transaction or check for graph existence. If a drop fails, the projection step will fail.
- **Impact**: Daily impact score updates might fail silently or leave the graph in an inconsistent state.
- **Recommendation**: Use `try-finally` more aggressively or use the `gds.graph.exists()` check before dropping.

## Finding 2: Unbounded Traversal Depth (Severity: LOW)
- **File**: `backend/src/services/discovery.service.js`
- **Issue**: The Cypher query `(me)-[:AUTHORED]->(p1)<-[:AUTHORED]-(collab)-[:AUTHORED]->(p2)<-[:AUTHORED]-(suggested)` is effectively a 4-hop traversal. While limited to co-authorship, a researcher with thousands of papers/co-authors could trigger a slow query.
- **Impact**: Potential latency spikes for highly connected "super-researchers".
- **Recommendation**: Add a time limit to the session query or pre-filter `p1` to the most recent 50 papers.

## Finding 3: Hardcoded PageRank Top-10 Limit (Severity: LOW)
- **File**: `ml-service/jobs/graph_rank.py`
- **Issue**: The `isTopContributor` badge is hardcoded to the Top 10 results (`LIMIT 10`).
- **Impact**: On a large graph (e.g., 100k users), Top 10 is too restrictive.
- **Recommendation**: Change to a percentile-based query using `apoc.agg.percentile` or a configurable threshold.

## Security Audit
- [✓] **No Injection**: Cypher queries use parameterization (`$userId`, etc.).
- [✓] **Plugin Isolation**: GDS/APOC are restricted to the internal network.

## Code Quality
- [✓] **Consistency**: Service/Controller pattern follows the established backend architecture.
- [✓] **Logging**: Error handling in the worker and ML jobs is descriptive.
