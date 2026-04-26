from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union, Optional
import asyncio
from ml_model import get_model
from cache import get_cache
import logging

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
