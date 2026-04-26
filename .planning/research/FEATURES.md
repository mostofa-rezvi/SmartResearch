# Features Research: Week 2 — AI Matching & Collaboration

## Table Stakes (Expected Features)

### AI Matching Engine
- **Semantic Researcher Matching**: Find researchers by topic intent, not just keyword.
- **Abstract Summarization**: Automatic generation of 2-3 sentence summaries for paper abstracts.
- **Skill Extraction**: Automatic identification of research skills from profiles and paper history.

### Search & Discovery
- **Hybrid Search**: Unified search bar handling both keywords and semantic queries.
- **Network Pathfinding**: "How am I connected to Researcher X?" (Distance-based discovery).
- **Reputation Filtering**: Sorting/filtering results by PageRank-derived impact scores.

### Collaboration Core
- **Group Dashboards**: Shared workspace for research groups.
- **Shared Paper Libraries**: Collective bookmarks and PDF management.
- **Live Activity Feeds**: Real-time notifications of new papers, edits, or group messages.

## Differentiators (Advanced Features)
- **Cross-Disciplinary Discovery**: Identifying non-obvious links between disparate research fields using graph centrality.
- **Trust-Weighted Matching**: Matching collaborators not just by skill, but by network trust (reputation).

## Research Notes
- **Chunking**: For long abstracts, chunking is required to maintain vector search accuracy.
- **Cold Start**: New researchers need a "seed" profile to be matchable; use LLM to bootstrap from their initial uploads.

## Dependencies
- **Neo4j GDS**: Required for PageRank/Centrality.
- **FastAPI ML Service**: Required for SBERT embeddings.
- **Redis Streams**: Required for syncing embedding updates to ES/Neo4j.
