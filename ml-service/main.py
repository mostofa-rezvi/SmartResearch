from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union, Optional
import asyncio
from ml_model import get_model
from cache import get_cache
from recommender.matrix_builder import MatrixBuilder
from recommender.cf_engine import CFEngine
from recommender.scorer import rrf_merge
import logging

# Initialize Recommender Components
builder = MatrixBuilder()
cf_engine = CFEngine(builder)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing recommendation matrix...")
    data = builder.fetch_interactions()
    builder.build_matrix(data)
    cf_engine.compute_user_similarity()

@app.post("/recommendations/{user_id}")
async def get_recommendations(user_id: int):
    try:
        cache = get_cache()
        # 1. Check Cache
        cached = cache.get_rec(user_id)
        if cached:
            return {"recommendations": cached, "cached": True}

        # 2. Get CF Results
        cf_results = cf_engine.get_recommendations(user_id)
        
        # 3. Get CBF Results (Semantic Search based on profile)
        # Mocking CBF for now as we need profile text fetching logic
        cbf_results = [] # TODO: Query ES for kNN matches
        
        # 4. Merge using RRF
        hybrid_results = rrf_merge(cbf_results, cf_results)
        final_results = hybrid_results[:20]
        
        # 5. Set Cache
        cache.set_rec(user_id, final_results)
        
        return {"recommendations": final_results, "cached": False}
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ResearchBridge ML Service")

class EmbedRequest(BaseModel):
    text: Union[str, List[str]]

@app.get("/")
async def root():
    return {"message": "Welcome to ResearchBridge ML Service"}

@app.get("/health")
async def health():
    return {"status": "ok", "model": "all-mpnet-base-v2"}

@app.post("/embed")
async def embed(request: EmbedRequest):
    try:
        model = get_model()
        cache = get_cache()
        
        # Handle single string case with caching
        if isinstance(request.text, str):
            cached = cache.get(request.text)
            if cached:
                return {"vectors": cached, "cached": True}
            
            vector = await asyncio.to_thread(model.encode, request.text)
            cache.set(request.text, vector)
            return {"vectors": vector, "cached": False}
        
        # Handle list case (batch caching is more complex, simple pass-through for now)
        vectors = await asyncio.to_thread(model.encode, request.text)
        return {"vectors": vectors}
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
