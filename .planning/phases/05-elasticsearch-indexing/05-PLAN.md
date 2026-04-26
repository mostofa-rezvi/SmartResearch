# Phase 5: Elasticsearch Setup & Indexing - Plan

**Phase:** 5
**Goal:** Establish foundational search capabilities with Elasticsearch mappings, pipeline workers, search endpoints, and deep health checks.

## Waves

### Wave 1: Elasticsearch Mappings
- [ ] Task 1: Create `initIndices()` function in `config/elasticsearch.js` to create `users`, `papers`, and `projects` indices.
- [ ] Task 2: Define `dense_vector` (dims: 384) and standard `text` properties inside the indices.
- [ ] Task 3: Execute `initIndices()` on backend boot inside `index.js`.

### Wave 2: Search Synchronization Pipeline
- [ ] Task 4: Create `src/workers/searchSync.worker.js`.
- [ ] Task 5: Implement Redis Streams `XREADGROUP` consumer logic for a `search_sync_group` on the `profile.created` stream.
- [ ] Task 6: Implement `@elastic/elasticsearch` `client.index()` upsert operations inside the worker.
- [ ] Task 7: Boot the search worker alongside the main Express app in `index.js`.

### Wave 3: Search Endpoint & Health Checks
- [ ] Task 8: Update `discovery.service.js` to replace mock search with a live Elasticsearch BM25 `multi_match` query.
- [ ] Task 9: Upgrade `GET /health` endpoint in `index.js` to perform deep connection checks on Postgres, Redis, Neo4j, and Elasticsearch.

---

## Task Details

### Wave 1: Elasticsearch Mappings

#### Task 1 & 2: Define and apply index mappings
- **Action**: Add an `initIndices()` method in `backend/src/config/elasticsearch.js` that checks if indices exist, and if not, creates them with the vector mappings.
- **Read First**: `05-RESEARCH.md`, `backend/src/config/elasticsearch.js`
- **Acceptance Criteria**:
  - `users`, `papers`, and `projects` indices exist in ES with `dense_vector` support.

#### Task 3: Boot execution
- **Action**: Call `initIndices()` during the main backend init in `backend/src/index.js` immediately after ES client creation.
- **Read First**: `backend/src/index.js`

### Wave 2: Search Synchronization Pipeline

#### Task 4, 5 & 6: Create Search Sync Worker
- **Action**: Create `backend/src/workers/searchSync.worker.js`. Following the pattern of `graphSync.worker.js`, consume `profile.created` and execute `esClient.index({ index: 'users', id: payload.id, document: { name: payload.name, email: payload.email } })`.
- **Read First**: `backend/src/workers/graphSync.worker.js`
- **Acceptance Criteria**:
  - New registrations synchronize to the `users` index seamlessly.

#### Task 7: Boot Search Worker
- **Action**: Require and `start()` the search sync worker in `backend/src/index.js`.

### Wave 3: Search Endpoint & Health Checks

#### Task 8: BM25 Keyword Search
- **Action**: In `backend/src/services/discovery.service.js` (inside `search` method), strip out the mock array and replace it with `esClient.search({ index: 'users,papers,projects', body: { query: { multi_match: { query, fields: ['name', 'title'] } } } })`.
- **Read First**: `backend/src/services/discovery.service.js`
- **Acceptance Criteria**:
  - Searching returns dynamic BM25 text-matched results across multiple indices.

#### Task 9: Deep Health Checks
- **Action**: In `backend/src/index.js`, update `app.get('/health')` to execute `SELECT 1` on PG, `ping` on Redis, `RETURN 1` on Neo4j, and `ping` on ES. Return aggregated statuses.
- **Read First**: `backend/src/index.js`
- **Acceptance Criteria**:
  - Health check accurately reflects the true availability of all 4 external datastores.

---

## Verification Criteria (must_haves)
- [ ] ES mappings accurately support `dense_vector` fields.
- [ ] User registration seamlessly pushes an ES document.
- [ ] `GET /api/v1/discovery/search` fetches valid results directly from ES.
- [ ] `GET /health` comprehensively surveys all downstream dependencies.
