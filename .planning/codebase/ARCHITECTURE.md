# Architecture

## System Paradigm
**Event-Driven Multi-Database Architecture**
ResearchBridge utilizes a "Triple Store" synchronization strategy. Data sovereignty is maintained by a relational primary database, while specialized read-optimized databases handle complex querying scenarios. State propagation is handled asynchronously.

## Core Flow (The Triple Store Sync)
1. **Primary Write**: A user profile is created/updated via Express API. Data is saved transactionally in PostgreSQL.
2. **Event Emission**: The `eventBus.service.js` produces a `profile.created` event to Redis Streams (`XADD`).
3. **Graph Sync**: A background worker (`graphSync.worker.js`) consumes the event and executes a `MERGE` query to update/create the `Researcher` node in Neo4j.
4. **Search Sync**: A parallel worker (`searchSync.worker.js`) consumes the same event and `index`es the profile data (including embeddings) into Elasticsearch.

## API Architecture (CSM)
The backend enforces a strict **Controller-Service-Model** pattern:
- **Routes**: Define HTTP methods, paths, and attach validation middlewares.
- **Controllers**: Handle HTTP request/response envelope extraction and formatting.
- **Services**: Contain pure business logic and cross-service orchestration. They do not know about HTTP requests or responses.
- **Data Access (Models/Config)**: Direct DB querying (Postgres, Neo4j, ES) is typically isolated to service or config layers currently, favoring raw SQL/Cypher for performance.

## Background Workers
Background workers run within the main Node.js process space but asynchronously poll Redis Streams using `Promise.all` loops. They implement Pending Entries List (PEL) reclamation on boot to ensure zero-data-loss event processing.
