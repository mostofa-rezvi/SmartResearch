# SmartResearch Multi-Database Architecture Integration Plan

Integrating Elasticsearch, Redis, and Neo4j alongside PostgreSQL creates a robust, scalable research platform. Each database solves a specific "hard problem" that traditional SQL struggles with.

## 1. Conceptual Roles (The "Why")

| Service | Primary Role | Why for SmartResearch? |
| :--- | :--- | :--- |
| **PostgreSQL** | Source of Truth | High consistency for Users, Payments, & Paper metadata. |
| **Elasticsearch** | Semantic Search | Fuzzy search on abstracts, faceted filtering (field, year, author), and typo tolerance. |
| **Redis** | Speed & Real-time | Caching hot papers, rate-limiting OTPs, and WebSocket session management. |
| **Neo4j** | Knowledge Graph | Modeling Citations, Co-authorship, and the "Trust Graph" between researchers. |

---

## 2. The "Triple Store" Synchronization Strategy

In a modern architecture, PostgreSQL remains the **Primary Database**. The other stores are **Consumer Databases** that stay in sync via an event-driven pattern.

### The Flow:
1.  **Write**: User uploads a paper (Store in **PostgreSQL**).
2.  **Event**: Backend emits a `PAPER_CREATED` event.
3.  **Sync**:
    *   **Elasticsearch Worker**: Flattens the metadata and abstract, then indexes it for search.
    *   **Neo4j Worker**: Creates a `:Paper` node and links it to the `:Author` node with a `AUTHORED_BY` relationship.
    *   **Redis Worker**: Invalidates the "Recent Papers" cache.

---

## 3. Implementation Blueprint

### A. Elasticsearch (Advanced Discovery)
Instead of `LIKE %query%` in SQL, we use ES to handle complex research queries.

**Conceptual Integration:**
- Store the searchable fields: `title`, `abstract`, `tags`, `author_names`.
- Use a "Suggest" API for the search bar as the user types.

### B. Redis (Performance & Logic)
**Conceptual Integration:**
- **Rate Limiting**: Prevent brute-force on login/register.
- **Cache**: Store the result of expensive SQL queries (e.g., "Top 10 Researchers in Biology").
- **Message Broker**: Use Redis Pub/Sub for real-time notifications when a user's paper is cited.

### C. Neo4j (The Research Graph)
The "Bridge" in ResearchBridge is best represented as a graph.

**Conceptual Integration:**
- **Nodes**: `User`, `Paper`, `Organization`, `Topic`.
- **Relationships**: 
    - `(User)-[:AUTHORED]->(Paper)`
    - `(Paper)-[:CITES]->(Paper)`
    - `(User)-[:FOLLOWS]->(User)`
    - `(User)-[:MEMBER_OF]->(ResearchGroup)`
- **Query Example**: *"Find all researchers who are within 2 degrees of separation from Prof. Einstein and work in Quantum Physics."* (Extremely fast in Neo4j, slow/impossible in SQL).

---

## 4. Proposed Next Steps

1.  **Connectivity**: Initialize clients in `backend/src/config/` for Redis and Elasticsearch (Neo4j is already there).
2.  **Service Layer**: Update `discovery.service.js` to query Elasticsearch instead of PostgreSQL.
3.  **Graph Logic**: Implement a "Trust Algorithm" in `reputation.service.js` that uses Neo4j to calculate a user's research impact.
4.  **Middleware**: Add Redis-based rate limiting to `backend/src/middleware/rateLimit.js`.

Would you like me to start by setting up the connection logic for Redis and Elasticsearch in your backend?
