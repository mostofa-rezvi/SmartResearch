# System Architecture: ResearchBridge (SRCP)

## Layers
1. **Presentation (The Face)**: 
   - Next.js 15 (App Router) for high-performance SSR.
   - Tailwind for "Academic Aesthetic" styling.
   - Socket.IO for real-time Community (Living Room) updates.
2. **Business Logic**:
   - **Node.js (Express)**: Centralized coordination for Identity, Auth, and Library management.
   - **Python (FastAPI)**: Heavy lifting for the Discovery Engine (Sentence-Embeddings) and TrustRank calculations.
   - **Kafka**: Asynchronous backbone for cross-domain events (e.g., scoring reputation after an answer is accepted).
3. **Data Ecosystem**:
   - **PostgreSQL**: Source of truth for users, credentials, journals, and the Q&A ledger.
   - **Neo4j**: Relationships between Researchers, Papers, and Topics. Powers the "TrustScore" graph.
   - **Elasticsearch**: Personalized search provider with vector-similarity boosting.
   - **Redis**: Low-latency caching for researcher feeds and OTP session rate-limiting.

## Principles
- **Unbypassable Security**: The "Gate" and "Onboarding" checks are baked into the request lifecycle.
- **Trust-Centric**: Every data node contributes to the overall credibility of the platform.
- **Zero Trust Architecture**: No internal service trusts another; all cross-service events are validated.