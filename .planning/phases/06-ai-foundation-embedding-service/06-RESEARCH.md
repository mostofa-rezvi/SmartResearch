# Phase 06: AI Foundation & Embedding Service — Research

## Standard Stack

| Role | Library / Tool | Rationale |
|------|----------------|-----------|
| **Core Framework** | FastAPI | High-performance async web framework for the ML service. |
| **Embedding Engine** | `sentence-transformers` | Gold standard for SBERT/Transformer sentence embeddings; handles pooling and normalization. |
| **Model** | `all-mpnet-base-v2` | Best balance of accuracy and latency (768-dim) in the SBERT family. |
| **Message Broker** | Redis Streams | Reliable event bus for profile/paper updates. |
| **Async Redis** | `redis-py` (v5.0+) | Support for `asyncio` and Consumer Groups. |
| **Concurrency** | `asyncio.to_thread` | Necessary to offload CPU-bound inference without blocking the FastAPI event loop. |

## Architecture Patterns

### 1. Dual-Interface Service
The ML service must act as both a **REST API** (for synchronous frontend requests) and a **Background Worker** (for asynchronous stream processing).
- **Shared Singleton**: The `SentenceTransformer` model should be loaded exactly once into memory and shared between the API handlers and the background thread.

### 2. Redis Streams Consumer Group (`XREADGROUP`)
Use the Consumer Group pattern to ensure:
- **Scalability**: Multiple worker instances can share the stream workload.
- **Reliability**: Use `XACK` to confirm processing. Messages that fail are tracked in the Pending Entries List (PEL).

### 3. Content-Addressable Embedding Cache
Implement a cache to avoid redundant GPU/CPU compute:
- **Key Pattern**: `emb:{model_name}:{sha256_text}`
- **Storage**: Store the raw vector as binary (`numpy.tobytes()`) for 30% less memory usage compared to JSON strings.

### 4. Batching for Initial Catch-up
When processing existing profiles (the "batch job"), the worker should use `count=50` in `XREADGROUP` to process messages in chunks, maximizing Transformer efficiency (matrix multiplication vs. scalar calls).

## Don't Hand-Roll

- **Mean-Pooling**: `sentence-transformers` does this automatically. Manually extracting hidden states from `transformers.AutoModel` is error-prone.
- **Vector Normalization**: Use the model's built-in `normalize_embeddings=True` to ensure cosine similarity equals dot product.
- **Redis Worker Loop**: Use the standard `while True` + `block` pattern in `redis-py`.

## Common Pitfalls

1. **GIL Blocking**: **[CRITICAL]** PyTorch operations block the Python GIL. If you run `model.encode()` directly in an `async def` route without `to_thread`, the entire server will hang during inference.
2. **Cold Starts**: The first inference call often takes 10x longer due to CUDA/PyTorch initialization. Perform a "warm-up" call with a dummy string during app startup.
3. **Memory Limits**: SBERT models (especially MPNET) can use 500MB+ RAM. If running in Docker, ensure `mem_limit` is set to at least 1.5GB to account for PyTorch overhead.
4. **Token Limits**: `all-mpnet-base-v2` has a 512-token limit. Content longer than this must be truncated to avoid "silent loss" of semantic information at the end of long abstracts.

## Code Examples

### Shared Model Singleton
```python
class MLModel:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = SentenceTransformer('all-mpnet-base-v2')
        return cls._instance
```

### Async Consumer Loop
```python
async def consume_stream():
    redis = await aioredis.from_url(REDIS_URL)
    while True:
        # Read from stream
        streams = await redis.xreadgroup(GROUP, CONSUMER, {STREAM: '>'}, count=10)
        for _, messages in streams:
            for msg_id, data in messages:
                # Process in thread
                vector = await asyncio.to_thread(model.encode, data['text'])
                # Store and Ack
                await store_embedding(data['id'], vector)
                await redis.xack(STREAM, GROUP, msg_id)
```

---

*Phase: 06-ai-foundation-embedding-service*
*Research completed: 2026-04-26*
*Confidence: HIGH (Standard SOTA patterns for 2026)*
