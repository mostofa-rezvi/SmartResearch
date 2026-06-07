from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union, Optional
import asyncio
from ml_model import get_model
from cache import get_cache
from recommender.matrix_builder import MatrixBuilder
from recommender.cf_engine import CFEngine
from recommender.scorer import rrf_merge
from llm_service import router as llm_router
from graphql_schema import graphql_router
from pdf_service import router as pdf_router
import logging

import os
import psycopg2
from contextlib import asynccontextmanager

# Initialize Recommender Components
builder = MatrixBuilder()
cf_engine = CFEngine(builder)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize recommendation matrix
    logger.info("Initializing recommendation matrix...")
    data = builder.fetch_interactions()
    builder.build_matrix(data)
    cf_engine.compute_user_similarity()
    yield
    # Shutdown logic can go here if needed

app = FastAPI(title="ResearchBridge ML Service", lifespan=lifespan)

# Register LLM routes (/llm/citations, /llm/feedback)
app.include_router(llm_router)

# Register GraphQL v2 — interactive playground at /graphql/v2
app.include_router(graphql_router, prefix="/graphql/v2")

# Register PDF extraction route (/library/extract-pdf)
app.include_router(pdf_router)

class RecRequest(BaseModel):
    profile_text: Optional[str] = None

@app.post("/recommendations/{user_id}")
async def get_recommendations(user_id: int, req: Optional[RecRequest] = None):
    try:
        cache = get_cache()
        # 1. Check Cache
        cached = cache.get_rec(user_id)
        if cached:
            return {"recommendations": cached, "cached": True}

        # 2. Get CF Results
        cf_results = cf_engine.get_recommendations(user_id)
        
        # 3. Get CBF Results (Semantic Search based on profile)
        cbf_results = []
        if req and req.profile_text:
            model = get_model()
            vector = cache.get(req.profile_text)
            if not vector:
                vector = await asyncio.to_thread(model.encode, req.profile_text)
                cache.set(req.profile_text, vector)
                
            from elasticsearch import Elasticsearch
            es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"))
            
            query = {
                "knn": {
                    "field": "embedding",
                    "query_vector": vector.tolist() if hasattr(vector, 'tolist') else vector,
                    "k": 20,
                    "num_candidates": 100
                }
            }
            try:
                res = es.search(index="profiles", body=query)
                for hit in res['hits']['hits']:
                    cbf_results.append((hit['_id'], hit['_score']))
            except Exception as es_err:
                logger.error(f"ES search error: {es_err}")
        
        # 4. Merge using RRF
        hybrid_results = rrf_merge(cbf_results, cf_results)
        
        # Apply calibrated threshold (0.533) to filter low-quality matches
        THRESHOLD = float(os.getenv("RECOMMENDATION_THRESHOLD", "0.533"))
        filtered_results = [res for res in hybrid_results if res[1] >= THRESHOLD]
        
        final_results = filtered_results[:20]

        # 4.5 Fallback if too few matches found (Cold Start / Too strict threshold)
        if len(final_results) < 5:
            logger.info(f"Only {len(final_results)} ML recommendations passed threshold, applying popular researchers fallback.")
            try:
                conn = psycopg2.connect(os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge"))
                cur = conn.cursor()
                cur.execute(
                    "SELECT id, cited_by_count FROM researcher_profiles ORDER BY cited_by_count DESC NULLS LAST LIMIT 10"
                )
                rows = cur.fetchall()
                # Track existing IDs to prevent duplicates
                existing_ids = {res[0] for res in final_results}
                for row in rows:
                    if row[0] not in existing_ids and len(final_results) < 20:
                        # Append id and a dummy score based on citations (always < threshold so it's clear it's a fallback)
                        final_results.append((row[0], min(THRESHOLD - 0.01, (row[1] or 0) / 1000000.0)))
                cur.close()
                conn.close()
            except Exception as db_fallback_err:
                logger.error(f"DB fallback error: {db_fallback_err}")
        
        # 5. Set Cache
        cache.set_rec(user_id, final_results)
        
        return {"recommendations": final_results, "cached": False}
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



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
                return {"vectors": cached, "embedding": cached, "cached": True}
            
            vector = await asyncio.to_thread(model.encode, request.text)
            cache.set(request.text, vector)
            return {"vectors": vector, "embedding": vector, "cached": False}
        
        # Handle list case (batch caching is more complex, simple pass-through for now)
        vectors = await asyncio.to_thread(model.encode, request.text)
        return {"vectors": vectors, "embedding": vectors}
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
