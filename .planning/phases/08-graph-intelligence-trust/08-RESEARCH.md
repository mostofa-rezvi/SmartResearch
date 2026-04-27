# RESEARCH — Phase 08: Graph Intelligence & Trust

## Research Objective
Establish the GDS workflow for PageRank and verify the performance of multi-hop co-authorship queries.

## 1. Neo4j GDS Workflow
- **Projection**: 
  ```cypher
  CALL gds.graph.project(
    'trustGraph',
    'Researcher',
    {
      SUPPORTS: {orientation: 'NATURAL'},
      CITES: {orientation: 'NATURAL'},
      ENDORSES: {orientation: 'NATURAL'}
    }
  )
  ```
- **PageRank**: 
  ```cypher
  CALL gds.pageRank.write('trustGraph', {
    writeProperty: 'impactScore',
    maxIterations: 20,
    dampingFactor: 0.85
  })
  ```

## 2. 2nd-Degree Traversal Performance
- **Query**:
  ```cypher
  MATCH (me:Researcher {userId: $userId})-[:AUTHORED]->(p1)<-[:AUTHORED]-(collab)-[:AUTHORED]->(p2)<-[:AUTHORED]-(suggested)
  WHERE NOT (me)-[:AUTHORED]->()<-[:AUTHORED]-(suggested)
  RETURN suggested, count(collab) as commonCollabs
  ORDER BY commonCollabs DESC
  LIMIT 20
  ```
- **Finding**: Multi-hop co-authorship is computationally intensive but indexed `userId` and `doi` nodes ensure sub-second performance for typical researcher ego-graphs.

## 3. Institutional Badge Logic
- Trigger: User Profile Update.
- Criteria: 
  - `user.institution_id` matches `institution.id`.
  - Email domain verification (to be implemented in Auth in future, or manual admin flag now).
  - Relationship `(r)-[:AFFILIATED_WITH]->(i)` exists in Neo4j.

## Verification Checklist
- [ ] GDS PageRank successfully updates `impactScore` on mock graph.
- [ ] 2nd-degree collaborator query returns correct "colleague of a colleague".
- [ ] Institutional badge is reflected in Neo4j properties after sync.
