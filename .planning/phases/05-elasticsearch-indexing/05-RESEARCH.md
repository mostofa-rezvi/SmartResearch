# Phase 5: Elasticsearch Setup & Indexing - Research

## 1. Elasticsearch Index Mappings
We need to map three primary entities: `users`, `papers`, and `projects`.
- **Dense Vector Field**: Elasticsearch supports `dense_vector` for ML embeddings. The vector dimensions (e.g., 384 for standard sentence-transformers, or 1536 for OpenAI) should be pre-defined. We will configure it as 384 dimensions for typical local ML models.
- **Initialization**: A boot script in `backend/src/config/elasticsearch.js` to create indices if they don't exist:
  ```json
  {
    "mappings": {
      "properties": {
        "text_content": { "type": "text" },
        "embedding": { "type": "dense_vector", "dims": 384, "index": true, "similarity": "cosine" }
      }
    }
  }
  ```

## 2. Index Synchronization Pipeline
- **Producer**: We already have `eventBus.service.js`. `profile.created` or `profile.updated` emits events.
- **Consumer**: We will create `backend/src/workers/searchSync.worker.js`.
  - It creates a consumer group on Redis Stream (e.g., `search_sync_group`).
  - Reads `profile.created` and pushes data via `@elastic/elasticsearch` `client.index()` or `client.update()`.

## 3. Basic Keyword Search (BM25)
- **Service**: Update `backend/src/services/discovery.service.js`.
- **Query**: Use standard `match` or `multi_match` query. BM25 is the default scoring algorithm for text fields in ES 5+.
  ```javascript
  const response = await esClient.search({
    index: 'users,papers,projects',
    body: {
      query: { multi_match: { query: searchTerm, fields: ['title', 'name', 'content'] } }
    }
  });
  ```

## 4. Health Checks
- Currently, `index.js` contains a basic health check (`/health` returning `{"status": "UP"}`).
- **Enhancement**: The health check should query dependencies:
  - Postgres: `SELECT 1`
  - Redis: `redisClient.ping()`
  - Neo4j: `session.run('RETURN 1')`
  - Elasticsearch: `esClient.ping()`
- The response should wrap these statuses to inform DevOps of deep infrastructure health.
