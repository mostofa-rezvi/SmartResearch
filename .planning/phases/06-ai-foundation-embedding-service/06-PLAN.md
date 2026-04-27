# PLAN — Phase 6: AI Foundation & Embedding Service

## Phase Boundary
This phase implements the ML infrastructure for the ResearchBridge platform. It sets up the Python FastAPI microservice, loads the SBERT model, and integrates it with the Redis Streams event bus and Elasticsearch.

- **Requirements**: AI-01, AI-02
- **Status**: Ready for execution
- **Success Criteria**:
    1. `/embed` endpoint returns 768-dim vectors for text.
    2. Redis Stream `profile.created` events trigger embedding generation.
    3. Embeddings are stored in Elasticsearch and cached in Redis.
    4. Batch script successfully embeds existing profile data.

---

## Wave 1: ML Service & Model Setup

### Task 6.1: Model Singleton & Warmup
<read_first>
- [ml-service/main.py](file:///d:/github/SmartResearch/ml-service/main.py)
- [06-RESEARCH.md](file:///d:/github/SmartResearch/.planning/phases/06-ai-foundation-embedding-service/06-RESEARCH.md)
</read_first>
<action>
Implement a singleton pattern in `ml-service/ml_model.py` to load `all-mpnet-base-v2`. Include a `warmup()` method that performs a single inference call during service startup to avoid first-request latency.
</action>
<acceptance_criteria>
- `ml-service/ml_model.py` exists and implements the singleton pattern.
- Service startup logs show "Model loaded and warmed up".
</acceptance_criteria>
**Requirements**: AI-01

### Task 6.2: FastAPI `/embed` Endpoint
<read_first>
- [ml-service/main.py](file:///d:/github/SmartResearch/ml-service/main.py)
</read_first>
<action>
Update `ml-service/main.py` to include a POST `/embed` endpoint. Use `asyncio.to_thread` (or `starlette.concurrency.run_in_threadpool`) to call `model.encode` to prevent blocking the event loop. Accept `{"text": "string"}` or `{"text": ["list", "of", "strings"]}`.
</action>
<acceptance_criteria>
- `POST /embed` returns a JSON object with a `vector` or `vectors` key.
- Multiple concurrent requests do not block the server (verified via health check during inference).
</acceptance_criteria>
**Requirements**: AI-01

---

## Wave 2: Redis Streams & Caching

### Task 6.3: SHA256 Embedding Cache
<read_first>
- [06-CONTEXT.md](file:///d:/github/SmartResearch/.planning/phases/06-ai-foundation-embedding-service/06-CONTEXT.md)
</read_first>
<action>
Implement a caching layer in `ml-service/cache.py` using Redis. Use SHA256 of text + model version as the key. Store vectors as binary blobs using `numpy.tobytes()` for memory efficiency.
</action>
<acceptance_criteria>
- Cache hits skip model inference.
- Redis keys follow the `emb:mpnet:v1:{hash}` pattern.
</acceptance_criteria>
**Requirements**: AI-01

### Task 6.4: Redis Streams Worker (Consumer Group)
<read_first>
- [ml-service/main.py](file:///d:/github/SmartResearch/ml-service/main.py)
</read_first>
<action>
Create `ml-service/worker.py`. Implement a Redis Streams consumer using `XREADGROUP`. Listen for `profile.created` messages. On receipt, generate embedding and acknowledge with `XACK`.
</action>
<acceptance_criteria>
- Worker creates consumer group `ml_workers` if not exists.
- Worker processes messages and clears them from PEL on success.
</acceptance_criteria>
**Requirements**: AI-02

---

## Wave 3: Storage & Batch Processing

### Task 6.5: Elasticsearch Schema Update (Vector Field)
<read_first>
- [docker-compose.yml](file:///d:/github/SmartResearch/docker-compose.yml)
</read_first>
<action>
Create a script `scripts/setup_es_vectors.py` to update the `profiles` and `papers` indices in Elasticsearch. Add a `dense_vector` field with `dims: 768` and `index: true` (for kNN search).
</action>
<acceptance_criteria>
- Elasticsearch mapping shows the `vector` field with correct dimensions.
</acceptance_criteria>
**Requirements**: AI-02

### Task 6.6: Batch Embedding Script
<read_first>
- [ml-service/worker.py](file:///d:/github/SmartResearch/ml-service/worker.py)
</read_first>
<action>
Create `scripts/batch_embed_profiles.py`. It should read all profiles from PostgreSQL that lack an embedding, send them to the `/embed` endpoint (or call the model directly if possible), and update Elasticsearch. Use batching (50 items per call).
</action>
<acceptance_criteria>
- Script runs and populates the `vector` field for existing profiles.
</acceptance_criteria>
**Requirements**: AI-02

---

## Verification Plan

### Automated Tests
- `pytest ml-service/tests/`: Test the `/embed` endpoint logic and cache hits.
- `scripts/verify_stream_processing.py`: Push a mock message to Redis and verify ES update.

### Manual UAT
1. Create a new profile via the backend API.
2. Verify Redis Stream carries the event.
3. Check Elasticsearch to confirm a 768-dim vector exists for the new profile.
4. Verify `/embed` response time is < 200ms for a single sentence.

---
**Must-Haves for Phase 06**:
- [ ] FastAPI `/embed` endpoint functioning.
- [ ] Redis Streams worker consuming messages.
- [ ] Vectors stored in Elasticsearch.
- [ ] SHA256 caching active.
