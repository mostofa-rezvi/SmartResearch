# Architecture Research: Week 2 — AI Matching & Collaboration

## Integration Patterns

### 1. The Embedding Pipeline (Async Sync)
- **Trigger**: Profile update or Paper upload in Postgres.
- **Bus**: Redis Streams (existing `sync-bus`).
- **Consumer (ML Service)**: FastAPI service picks up the event, generates SBERT embeddings.
- **Producer (ML Service)**: Pushes embeddings back to Redis Streams.
- **Consumers (Sync Workers)**: 
    - ES Worker updates `dense_vector` field in Elasticsearch.
    - Neo4j Worker updates node properties if needed (or just ES handles vector search).

### 2. Graph Analytics Flow
- **Periodic Job**: Every X hours, run PageRank and Betweenness algorithms via Neo4j GDS.
- **Storage**: Write scores back to Neo4j node properties.
- **Query**: Use scores as "boost" factors in Cypher or ES queries.

### 3. Real-Time Sync (Socket.io + Redis)
- **Backend**: Node/Express server uses Socket.io with Redis Adapter.
- **Rooms**: `research-group:[id]` for group-specific collaboration.
- **Event Flow**:
    1. User A posts a message/paper to API.
    2. API saves to DB and publishes to Redis.
    3. Socket.io instances subscribe to Redis, broadcast to all clients in the room.

### 4. Hybrid Search Query
- **Search API**: Receives query string.
- **Step A**: Get embedding for query from FastAPI.
- **Step B**: Execute parallel ES query (BM25 + kNN).
- **Step C**: RRF Fusion in ES returns unified results.

## Data Flow Diagram (Mental Model)
`Postgres -> Redis Stream -> FastAPI (Embed) -> Redis Stream -> ES (Vector) & Neo4j (Graph)`

## Suggested Build Order
1. **Infrastructure Expansion**: Redis Adapter + Neo4j GDS setup.
2. **Embedding Service**: SBERT integration in FastAPI.
3. **Sync Pipeline**: Wiring Redis Streams to handle embeddings.
4. **Hybrid Search API**: ES 8 RRF implementation.
5. **Real-time Core**: Socket.io logic and UI components.
