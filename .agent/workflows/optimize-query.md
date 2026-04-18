# Workflow: Optimize ResearchBridge Query

Focus on the performance of the **Discovery Engine** and **Trust Graph**.

## 1. Relational (PostgreSQL)
- Analyse long-running queries in the Library (Journal Directory).
- Add partial indices for `onboarding_completed=true` or quality tiers (Q1/Q2).

## 2. Graph (Neo4j)
- Use `PROFILE` on TrustRank traversals.
- Refactor deep relationships (e.g., citation chains) to use optimized edge-weights.
- Ensure all Researcher IDs have corresponding indices.

## 3. Search (Elasticsearch)
- Update analyzer settings for the Natural Language search to handle academic terminology.
- Balance Vector Similarity weights against traditional text scoring.

## 4. Cache (Redis)
- Identify hot feeds and increase TTL where appropriate to reduce DB load.