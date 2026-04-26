# Phase 5: Elasticsearch Setup & Indexing - Fixes Applied

**Phase:** 5
**Agent:** gsd-code-fixer
**Date:** 2026-04-26

## Fixes Implemented

### 🔴 High Severity (Must Fix)
1. **Unprocessed Pending Entries (PEL) Leak**
   - **Status:** Fixed
   - **Resolution:** Added a `processPendingMessages()` routine to both `searchSync.worker.js` and `graphSync.worker.js`. On startup, before listening for new messages, the workers explicitly call `XREADGROUP ... 0` to retrieve and process any historical messages that failed to acknowledge in the past. 

### 🟡 Medium Severity (Should Fix)
1. **Synchronous/Blocking Health Check Operations**
   - **Status:** Fixed
   - **Resolution:** Updated `backend/src/index.js` to utilize `Promise.allSettled()` instead of sequential `await`ing for Postgres, Redis, Neo4j, and Elasticsearch pings. Introduced a `withTimeout` wrapper that enforces a strict 3-second limit per check. If any database exceeds this limit, it is recorded as `DOWN` and the response proceeds without hanging.
2. **Hardcoded Consumer Name in Workers**
   - **Status:** Fixed
   - **Resolution:** Replaced the static `'search_worker_1'` and `'worker_1'` consumer names with dynamically generated identities using `process.pid` (`search_worker_${process.pid}`), allowing multiple backend nodes to safely share the same stream group without trampling PEL state.

### 🟢 Low Severity (Nice to Have)
1. **Elasticsearch Mappings Hardcoded**
   - **Status:** Fixed
   - **Resolution:** Refactored `initIndices()` in `backend/src/config/elasticsearch.js` to accept precise, domain-specific mappings mapping arrays. `users` now maps `name` and `email`, while `papers` maps `title`, `abstract`, and `authors`, all while retaining the critical `dense_vector` embedding capability.

## Conclusion
All vulnerabilities and structural weaknesses flagged in the Phase 5 code review have been patched. The search index schemas are rigorous, the real-time pipeline is fault-tolerant to node crashes, and the health checks are production-grade resilient against downstream latency.
