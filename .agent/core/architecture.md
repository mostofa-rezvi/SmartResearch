# System Architecture

## Layers
1. **Presentation**: Next.js 15 (App Router), SSR, Tailwind, Socket.IO client
2. **Business Logic**:
   - Node.js + Express (REST + WebSocket)
   - Python FastAPI (ML inference only)
   - Kafka for cross-service events
3. **Data**:
   - PostgreSQL: Users, Projects, Posts, Subscriptions
   - Neo4j: (Researcher)-[:AUTHORED]->(Paper)-[:HAS_TOPIC]->(Topic)
   - Elasticsearch: Full-text + vector search
   - Redis: Session store, pre‑cached feeds, rate limiting

## Principles
- Clean separation between Node (business) and Python (ML)
- Event-driven communication via Kafka
- All APIs are versioned and documented
- Zero trust security model