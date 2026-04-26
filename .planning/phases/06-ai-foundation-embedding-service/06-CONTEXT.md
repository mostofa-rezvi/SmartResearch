# Phase 06: AI Foundation & Embedding Service — Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Autonomous initialization + AI-SPEC + Research

<domain>
## Phase Boundary
This phase focuses on the ML service infrastructure for semantic embeddings. It includes the FastAPI REST interface, the Redis Streams worker for async processing, and the storage logic for Elasticsearch and Redis.

**Deliverables:**
- FastAPI microservice in `ml-service/`.
- `/embed` endpoint returning 768-dim vectors.
- Redis Stream consumer processing `profile.created` events.
- Deduplication cache using Redis.
- Script for batch-embedding existing profiles in PostgreSQL.
</domain>

<decisions>
## Implementation Decisions

### ML Architecture
- **Framework**: `sentence-transformers` with `all-mpnet-base-v2` model.
- **Concurrency**: Offload all inference to `asyncio.to_thread` to prevent event loop blocking.
- **Model Loading**: Load as a singleton on app startup; warm up with a dummy string.

### Async Processing (Redis Streams)
- **Pattern**: Consumer Groups (`XREADGROUP`).
- **Reliability**: Use `XACK` and monitor PEL.
- **Error Handling**: Move failed messages to `ml.failed` (Dead Letter Stream).
- **Batching**: Process 50 messages per loop iteration during catch-up.

### Storage & Caching
- **Deduplication**: SHA256 content hash + model version as cache key (`emb:mpnet:v1:{hash}`).
- **Elasticsearch**: Store in `dense_vector` field (dims: 768).
- **Format**: Binary storage in Redis (`tobytes`) for efficiency.

### the agent's Discretion
- Choice of specific SHA256 library.
- Specific logging format for the worker.
- HTTP client for communicating with Elasticsearch (if direct, use `elasticsearch-py`).

</decisions>

<canonical_refs>
## Canonical References
- [06-AI-SPEC.md](file:///d:/github/SmartResearch/.planning/phases/06-ai-foundation-embedding-service/06-AI-SPEC.md) — Framework and Eval strategy.
- [06-RESEARCH.md](file:///d:/github/SmartResearch/.planning/phases/06-ai-foundation-embedding-service/06-RESEARCH.md) — Technical patterns and pitfalls.
</canonical_refs>

<specifics>
## Specific Requirements
- The `/embed` endpoint must support both single strings and lists of strings.
- Truncate input text to 512 tokens to match model limits.
</specifics>

<deferred>
## Deferred Ideas
- GPU acceleration (will remain on CPU for MVP).
- Advanced chunking for long research papers (handled in Phase 7).
</deferred>

---
*Phase: 06-ai-foundation-embedding-service*
*Context gathered: 2026-04-26 via autonomous chain*
