# Phase 4: Neo4j Graph & Redis Streams Bootstrap - Research

## 1. Domain Investigation

### Redis Streams Event Bus
- **Producer (`XADD`)**: `ioredis` provides the `xadd` command. The producer pushes an event to a stream key (e.g., `profile.created`). The payload consists of key-value pairs (e.g., `payload`, `JSON.stringify(user)`). 
- **Consumer Group (`XGROUP CREATE` / `XREADGROUP`)**: A consumer group allows multiple workers to reliably consume messages.
  - Command: `redisClient.xgroup('CREATE', streamKey, groupName, '$', 'MKSTREAM')` initializes the group, parsing new messages (`$`), and creates the stream if it doesn't exist (`MKSTREAM`).
  - Command: `redisClient.xreadgroup('GROUP', groupName, consumerName, 'BLOCK', blockTimeMs, 'STREAMS', streamKey, '>')` reads new messages.
  - Acknowledgment: `redisClient.xack(streamKey, groupName, messageId)` signals successful processing.

### Neo4j Graph Schema
- **Nodes**: `Researcher`, `Paper`, `Topic`, `Institution`.
- **Properties**:
  - `Researcher`: `id` (maps to postgres `users.id`), `name`.
  - `Topic`: `id` (maps to domains/skills), `name`.
  - `Institution`: `id`, `name`.
- **Cypher Example (Graph Sync)**:
  ```cypher
  MERGE (r:Researcher {id: $userId})
  SET r.name = $name
  RETURN r
  ```
- **Constraints**: Constraints should be defined to ensure data integrity and query performance.
  ```cypher
  CREATE CONSTRAINT IF NOT EXISTS FOR (r:Researcher) REQUIRE r.id IS UNIQUE;
  ```

## 2. Codebase Patterns
- **Redis Initialization**: `backend/src/config/redis.js` exports `initRedis` and `getRedisClient`. The client is already available.
- **Neo4j Initialization**: `backend/src/config/neo4j.js` exports `initNeo4j` and `getSession`.
- **Existing Event Emitter**: `backend/src/utils/kafkaEmitter.js` is a mock. It should be replaced with `backend/src/services/eventBus.service.js` which exports a standard `emitEvent(topic, payload)` function.

## 3. Implementation Strategy
1. **Event Bus Service**: Create `src/services/eventBus.service.js`. Implement `emitEvent` using `ioredis` `xadd`.
2. **Neo4j Constraints**: Create an initialization script or function inside `neo4j.js` to assert `UNIQUE` constraints on node IDs.
3. **Graph Sync Worker**: Create `src/workers/graphSync.js`. This worker will:
   - Connect to Redis and Neo4j.
   - Create the consumer group for `profile.created`.
   - Loop `xreadgroup` to consume events.
   - For each event, extract the payload, run the Neo4j `MERGE` query, and `XACK` the message.
4. **Trigger Integration**: Update `auth.controller.js` (registration) to call `eventBus.emitEvent('profile.created', user)`.

## 4. Verification Architecture
- **Unit/Integration Tests**: Mock `ioredis` and verify `emitEvent` calls `xadd`. 
- **E2E**: Create a user via `/api/v1/auth/register`, check the Redis stream for the message, and verify the Neo4j database contains the `Researcher` node.
