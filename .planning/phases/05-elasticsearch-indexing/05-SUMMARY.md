# Phase 5: Elasticsearch Setup & Indexing - Summary

**Completed:** 2026-04-26
**Status:** Done

## What Was Built
1. **Elasticsearch Index Mappings**:
   - Updated `backend/src/config/elasticsearch.js` to create `users`, `papers`, and `projects` indices on backend boot.
   - Designed schema to incorporate both standard `text` properties (for BM25 search) and a 384-dimensional `dense_vector` property structured for future sentence-transformer cosine similarity embedding mapping.

2. **Search Synchronization Pipeline**:
   - Implemented `backend/src/workers/searchSync.worker.js`.
   - The worker runs an isolated `XREADGROUP` consumer attached to the `search_sync_group` consumer group on the `profile.created` Redis stream.
   - New user registrations flow smoothly across the event bus and trigger automated `@elastic/elasticsearch` `client.index()` upserts into the `users` index, ensuring search indexing operates asynchronously and reliably without degrading core request paths.

3. **BM25 Search Endpoint**:
   - Stripped the legacy mock arrays from `backend/src/services/discovery.service.js`.
   - Wired the discovery module to dispatch native Elasticsearch `multi_match` queries leveraging BM25 scoring over fields like `name` and `title`.
   - Refined the "Explainability Layer" to calculate a composite score merging the Elasticsearch BM25 `_score` with user profile keyword matches (`tags`), maximizing recommendation transparency.

4. **Deep Health Checks**:
   - Hardened `GET /health` inside `backend/src/index.js` by wrapping the ping and `SELECT 1` queries for all 4 major stores (`postgres`, `redis`, `neo4j`, `elasticsearch`).
   - If any core connection is lost, it seamlessly transitions the payload state to `DEGRADED`, enhancing the capability of infrastructure-level deployment readiness probes.

## Next Steps
- Verify the cross-database sync with end-to-end integration testing.
- The pipeline natively intercepts and maps vector mappings, unlocking pure capability for the incoming LLM embedding worker logic.
