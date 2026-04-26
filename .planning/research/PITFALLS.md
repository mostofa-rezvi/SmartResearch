# Pitfalls Research: Week 2 — AI Matching & Collaboration

## Common Mistakes

### AI & Embeddings
- **High Latency**: Synchronous embedding generation in the request path will kill UI performance. **Fix**: Use async background jobs via Redis Streams.
- **Model Size**: Loading large BERT models can exceed Docker container RAM. **Fix**: Use `all-MiniLM-L6-v2` for a better performance/memory trade-off.
- **Vector Drift**: Updating profiles without re-indexing embeddings leads to stale search results. **Fix**: Atomic sync triggers on all profile/paper mutations.

### Real-Time Collaboration
- **Memory Leaks**: Not cleaning up Socket.io listeners on the client side (Next.js components). **Fix**: Always return cleanup functions in `useEffect`.
- **Scaling without Redis**: Using local event emitters for WebSockets works in dev but fails in production (Docker/Multiple instances). **Fix**: Standardize on `@socket.io/redis-adapter` from day one.
- **Message Ordering**: In high-velocity feeds, messages might arrive out of order. **Fix**: Use DB timestamps as the source of truth for UI sorting.

### Graph & Search
- **GDS Overhead**: Running PageRank on the entire graph too frequently can lock Neo4j. **Fix**: Run periodically or on a subset (subgraph projection).
- **Over-reliance on Vector**: Pure vector search often fails on specific acronyms or author names. **Fix**: Use Hybrid Search (BM25 + Vector) with RRF.

### Integration
- **Dependency Hell**: FastAPI and Node services drift in API schemas. **Fix**: Shared JSON schemas or strict Joi/Pydantic validation.
