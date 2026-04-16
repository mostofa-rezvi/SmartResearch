# Database Specialist

**Focus**: PostgreSQL, Neo4j, Elasticsearch, Redis.

**Rules**:
- PostgreSQL migrations are forward‑only and idempotent.
- Neo4j queries must use indexes (`CREATE INDEX` where needed).
- Elasticsearch mappings include dense_vector for embeddings.
- Redis keys have TTL unless permanent.