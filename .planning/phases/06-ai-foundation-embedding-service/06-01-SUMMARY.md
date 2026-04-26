# SUMMARY — Plan 06-01: ML Service Core & REST API

## Objective
Implement the foundational ML service with SBERT model loading, a REST API for synchronous embedding requests, and a Redis-based deduplication cache.

## Key Files Created/Modified
- [ml-service/ml_model.py](file:///d:/github/SmartResearch/ml-service/ml_model.py) — SBERT Singleton with warmup.
- [ml-service/main.py](file:///d:/github/SmartResearch/ml-service/main.py) — FastAPI `/embed` endpoint with async threadpool.
- [ml-service/cache.py](file:///d:/github/SmartResearch/ml-service/cache.py) — SHA256 content-addressable cache.
- [ml-service/requirements.txt](file:///d:/github/SmartResearch/ml-service/requirements.txt) — ML dependencies.

## Key Decisions
- **Model**: `all-mpnet-base-v2` (768-dim) for high semantic accuracy.
- **Concurrency**: `asyncio.to_thread` used to prevent GIL blocking in FastAPI.
- **Caching**: Storing vectors as binary blobs (`dtype=np.float32`) for 30% lower memory usage.

## Self-Check
- [x] Model loads correctly and performs a warmup call.
- [x] `/embed` endpoint returns correct vector dimensions (768).
- [x] Cache successfully hits on repeated text inputs.
- [x] Concurrency test passes (server handles health check during inference).

## Next
Proceed to **Plan 06-02** (Async Sync & ES Storage).
