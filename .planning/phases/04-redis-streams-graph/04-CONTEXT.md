# Phase 4: Neo4j Graph & Redis Streams Bootstrap - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces the legacy Kafka mock emitter with a real-time event bus powered by Redis Streams. It also bootstraps the fundamental Neo4j Graph structure to support TrustRank algorithms and semantic discovery. As a primary integration flow, user registrations will publish events to Redis Streams which will be consumed to create synchronized nodes in the Neo4j graph.

</domain>

<decisions>
## Implementation Decisions

### 1. Event Bus (Message Broker)
- **Technology**: Redis Streams (NOT Kafka, to reduce infrastructure overhead while maintaining stream persistence).
- **Library**: `ioredis` utilizing `XADD` for producers and `XREADGROUP` / `XREAD` for consumers.
- **Topics (Stream Keys)**:
  - `profile.created`
  - `match.request`
  - `event.behaviour`

### 2. Neo4j Graph Schema
- **Nodes**:
  - `Researcher` (mapped from PostgreSQL `users`)
  - `Paper`
  - `Topic` (mapped from PostgreSQL `skills` and `domains`)
  - `Institution` (mapped from PostgreSQL `institutions`)
- **Relationships (Preliminary)**:
  - `(Researcher)-[:AFFILIATED_WITH]->(Institution)`
  - `(Researcher)-[:AUTHORED]->(Paper)`
  - `(Researcher)-[:INTERESTED_IN]->(Topic)`

### 3. Synchronization Flow
- **Trigger**: New user registration (and subsequently, profile completion).
- **Producer**: Node.js API (Auth/Profile controllers) pushes a message to the `profile.created` Redis Stream.
- **Consumer**: A background worker (could be a distinct file like `src/workers/graphSync.js` initiated at startup) reads the stream using `XREADGROUP` and creates the corresponding `Researcher` node in Neo4j.

### the agent's Discretion
- Exact formatting of the payload placed into the Redis Stream (e.g., JSON stringified within a specific stream field).
- Redis Stream consumer group naming and initial ID fetching (`$` vs `0-0` based on desired replay behavior, typically `$` for new streams unless replay is explicitly needed).
- How the background worker is spawned (e.g., initialized inside `src/index.js` or ran as a separate process via `package.json` script. Recommend running alongside the main process for simplicity in MVP).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Configurations
- `backend/src/config/redis.js` — Existing Redis client initialization.
- `backend/src/config/neo4j.js` — Existing Neo4j driver initialization.

### Existing Architecture
- `backend/src/utils/kafkaEmitter.js` — The mock implementation that must be replaced.

</canonical_refs>

<specifics>
## Specific Ideas
- Implement a `src/services/eventBus.service.js` to wrap `ioredis` XADD operations cleanly, replacing the `kafkaEmitter`.
- Ensure the Neo4j config gracefully handles reconnects and constraints (e.g., `CREATE CONSTRAINT ON (r:Researcher) ASSERT r.id IS UNIQUE`).

</specifics>

<deferred>
## Deferred Ideas
- Dead Letter Queues (DLQ) for failed Redis Stream events (deferred to hardening phase).
- Syncing historical/existing PostgreSQL users into Neo4j (deferred to a one-off migration script, out of scope for the real-time trigger).

</deferred>

---

*Phase: 04-redis-streams-graph*
*Context gathered: 2026-04-26 via Discussion*
