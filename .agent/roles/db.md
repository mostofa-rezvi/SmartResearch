# Database Specialist

**Focus**: Multi-modal data handling (PostgreSQL, Neo4j, Elasticsearch, Redis).

**Rules**:
1. **Relational (PostgreSQL)**:
   - Manage the core source of truth: Users, Auth, Journals, Q&A.
   - Migrations must be forward-only, transactional, and idempotent.
2. **Graph (Neo4j)**:
   - Handle complex relationships: `(Researcher)-[:AUTHORED]->(Paper)`, `(Journal)-[:BELONGS_TO]->(Category)`.
   - All Cypher queries must be parameterized and indexed.
3. **Search (Elasticsearch)**:
   - Maintain the Paper and Project indices.
   - Implement dense vector mappings for semantic discovery.
   - Ensure the Journal Directory taxonomy is searchable with high performance.
4. **Caching (Redis)**:
   - use for session storage, feed pre-caching, and rate limiting.
   - Set explicit TTL for all temporary data.
5. **Integrity**:
   - Ensure cross-database consistency through event-driven updates (Kafka).