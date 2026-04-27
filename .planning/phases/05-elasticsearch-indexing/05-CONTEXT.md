# Phase 5: Elasticsearch Setup & Indexing - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the foundational search capabilities using Elasticsearch. It involves defining index mappings (including vector fields for future ML embeddings), building the data synchronization pipeline from Redis Streams to Elasticsearch, and creating a basic keyword (BM25) search endpoint. Additionally, comprehensive health-check endpoints will be added across all services to ensure robust monitoring.

</domain>

<decisions>
## Implementation Decisions

### 1. Elasticsearch Index Mappings
- **Indices**: `users`, `papers`, `projects`.
- **Fields**: Must include a `dense_vector` field to support subsequent semantic search phases, alongside standard text fields for BM25 keyword search.

### 2. Index Synchronization Pipeline
- **Trigger**: Profile saves (and theoretically papers/projects creation).
- **Transport**: Reuse the Redis Streams event bus (`profile.created` or a generic `search.index` topic).
- **Consumer**: A new Redis Streams consumer worker (`searchSync.worker.js`) that reads events and upserts documents into Elasticsearch.

### 3. Search API
- **Endpoint**: Implement a basic BM25 keyword search endpoint (e.g., `GET /api/v1/search`) that queries the Elasticsearch indices.

### 4. Health Checks
- **Scope**: Implement/enhance `/health` endpoints to verify connections to PostgreSQL, Redis, Neo4j, and Elasticsearch, responding with a consolidated status payload.

</decisions>

---

*Phase: 05-elasticsearch-indexing*
*Context gathered via inline requirements mapping.*
