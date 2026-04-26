# Stack Research: Week 2 — AI Matching & Collaboration

## Standard Stack (2026)

### AI & Embeddings
- **Sentence-BERT (SBERT)**: Use `sentence-transformers` library in the existing Python FastAPI service.
- **Model**: `all-MiniLM-L6-v2` for speed or `multi-qa-mpnet-base-dot-v1` for higher quality semantic matching.
- **Vector Database**: Use **Elasticsearch 8.x**'s native `dense_vector` type and HNSW indexing.

### Real-Time Collaboration
- **Socket.io**: Standard for Node.js real-time communication.
- **Redis Adapter**: `@socket.io/redis-adapter` for horizontal scaling across multiple instances.
- **Redis 7**: Use existing Redis instance for Pub/Sub and stream processing.

### Graph Analytics
- **Neo4j Graph Data Science (GDS)**: Essential for calculating centrality metrics (PageRank, Betweenness).
- **Cypher**: Query language for pathfinding between researchers.

### Search Engine
- **Elasticsearch 8.x**: Hybrid search using **Reciprocal Rank Fusion (RRF)** to combine BM25 (keyword) and kNN (vector) results.

## Rationale
- **Hybrid Search**: Solves "vocabulary mismatch" (semantic) while keeping "exact match" (ID/Name) precision.
- **Redis Adapter**: Ensures that users on different server instances can still see each other's live updates.
- **FastAPI**: Lightweight and fast for hosting ML models like SBERT.

## What NOT to use
- **Hand-rolled WebSockets**: High maintenance; use Socket.io for fallback and room management.
- **Pinecone/Milvus**: Avoid adding another DB; Elasticsearch 8 handles vector search natively and effectively for this scale.

## Confidence Levels
- **SBERT + FastAPI**: High (Industry standard)
- **Elasticsearch Hybrid Search**: High (Proven pattern for research)
- **Neo4j GDS**: High (Built-in for these metrics)
