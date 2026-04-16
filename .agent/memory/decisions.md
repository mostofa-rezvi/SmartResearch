# Architecture Decision Records (ADR)

## ADR-001: Use Kafka for async events instead of direct HTTP calls
- **Date**: 2024-01-15
- **Context**: ML inference is slow; we don't want to block user requests.
- **Decision**: Node produces events to Kafka; ML service consumes and updates scores.
- **Consequences**: Added operational complexity but improved responsiveness.

## ADR-002: Neo4j for researcher‑paper graph
- **Date**: 2024-02-01
- **Context**: Need to traverse co‑authorship and citation networks efficiently.
- **Decision**: Use Neo4j alongside PostgreSQL.
- **Consequences**: Dual‑write pattern required; eventual consistency accepted.

## ADR-003: Server‑Side Rendering for public pages
- **Date**: 2024-03-10
- **Context**: SEO critical for research platform.
- **Decision**: Next.js App Router with SSR for all public routes.
- **Consequences**: Increased server load; mitigated by Cloudflare caching.