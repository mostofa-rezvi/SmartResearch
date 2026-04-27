# Phase 4: Neo4j Graph & Redis Streams Bootstrap - Plan

**Phase:** 4
**Goal:** Establish a reliable Redis Streams event bus and bootstrap the core graph database schema with real-time sync.

## Waves

### Wave 1: Event Bus Foundation
- [ ] Task 1: Create `eventBus.service.js` to wrap `ioredis` `XADD`.
- [ ] Task 2: Replace `kafkaEmitter.js` mock with `eventBus.service.js`.
- [ ] Task 3: Instrument user registration to emit `profile.created` event.

### Wave 2: Neo4j Schema Bootstrapping
- [ ] Task 4: Define Neo4j constraints function in `config/neo4j.js` for `Researcher`, `Topic`, `Institution`, and `Paper`.
- [ ] Task 5: Execute constraints initialization on backend startup.

### Wave 3: Graph Sync Worker (Consumer)
- [ ] Task 6: Create `src/workers/graphSync.worker.js` with Redis `XREADGROUP` consumer logic.
- [ ] Task 7: Implement `MERGE` Cypher queries inside the worker to create Neo4j nodes.
- [ ] Task 8: Boot the worker alongside the main Express app in `index.js`.

---

## Task Details

### Wave 1: Event Bus Foundation

#### Task 1: Create eventBus service
- **Action**: Create `backend/src/services/eventBus.service.js`. It should require `getRedisClient` from `config/redis.js` and implement an `emitEvent(topic, payload)` function using `.xadd(topic, '*', 'payload', JSON.stringify(payload))`.
- **Read First**: `backend/src/config/redis.js`
- **Acceptance Criteria**:
  - `eventBus.service.js` is created and correctly utilizes `ioredis` `xadd`.

#### Task 2: Replace legacy Kafka mock
- **Action**: Delete `backend/src/utils/kafkaEmitter.js` (or leave it as deprecated). Refactor any references to point to `eventBus.service.js`.
- **Read First**: `backend/src/utils/kafkaEmitter.js`
- **Acceptance Criteria**:
  - `kafkaEmitter.js` is no longer the active event bus standard.

#### Task 3: Instrument user registration
- **Action**: In `backend/src/controllers/auth.controller.js` (inside `register` method), call `eventBus.emitEvent('profile.created', { id: user.id, name: user.name, email: user.email })`.
- **Read First**: `backend/src/controllers/auth.controller.js`
- **Acceptance Criteria**:
  - Successfully registered users trigger a `profile.created` event payload onto the Redis Stream.

### Wave 2: Neo4j Schema Bootstrapping

#### Task 4: Define Neo4j constraints
- **Action**: In `backend/src/config/neo4j.js`, add an `initConstraints()` function that runs `CREATE CONSTRAINT IF NOT EXISTS FOR (n:Label) REQUIRE n.id IS UNIQUE` for Labels: `Researcher`, `Topic`, `Institution`, `Paper`.
- **Read First**: `backend/src/config/neo4j.js`
- **Acceptance Criteria**:
  - Constraints logic accurately prevents duplicate IDs for primary nodes.

#### Task 5: Execute constraints initialization
- **Action**: Call `initConstraints()` inside the `initNeo4j()` function or from `index.js` immediately after connection success.
- **Read First**: `backend/src/index.js`, `backend/src/config/neo4j.js`
- **Acceptance Criteria**:
  - Starting the backend automatically asserts the Neo4j schema definitions.

### Wave 3: Graph Sync Worker (Consumer)

#### Task 6: Create graph sync worker logic
- **Action**: Create `backend/src/workers/graphSync.worker.js`. Implement a loop that establishes a consumer group (`xgroup CREATE`), reads messages (`xreadgroup`), and processes them, followed by `xack`.
- **Read First**: `04-RESEARCH.md`
- **Acceptance Criteria**:
  - Worker robustly consumes from `profile.created` stream without crashing.

#### Task 7: Implement Neo4j Node Creation
- **Action**: Inside the worker, when a `profile.created` message is received, execute `session.run('MERGE (r:Researcher {id: $id}) SET r.name = $name, r.email = $email', { id, name, email })`.
- **Read First**: `backend/src/config/neo4j.js`
- **Acceptance Criteria**:
  - Consumed events reliably map to Neo4j graph nodes.

#### Task 8: Boot the worker
- **Action**: Require and start the worker loop at the end of `backend/src/index.js` when running in the relevant environment (or as a detached process).
- **Read First**: `backend/src/index.js`
- **Acceptance Criteria**:
  - The worker runs seamlessly alongside the main backend process.

---

## Verification Criteria (must_haves)
- [ ] Redis stream `profile.created` exists and receives events.
- [ ] `Researcher` nodes are created in Neo4j upon backend registration.
- [ ] Unique ID constraints are active in Neo4j.
