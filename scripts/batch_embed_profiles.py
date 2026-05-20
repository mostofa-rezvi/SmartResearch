import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from elasticsearch import Elasticsearch
import os
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000/embed")
ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

def batch_embed():
    # 1. Connect to PG
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        logger.info("Connected to PostgreSQL")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        return

    # 2. Connect to ES
    es = Elasticsearch(ES_URL)

    # 3. Fetch profiles
    cur.execute("SELECT id, name, role, institution, research_interests FROM researcher_profiles")
    profiles = cur.fetchall()
    logger.info(f"Found {len(profiles)} profiles to process")

    # 4. Process in batches
    batch_size = 50
    for i in range(0, len(profiles), batch_size):
        batch = profiles[i:i + batch_size]
        
        # Construct text for embedding
        texts = []
        for p in batch:
            interests = p.get('research_interests') or []
            if isinstance(interests, str):
                try:
                    import json
                    interests = json.loads(interests)
                except:
                    pass
            interests_str = ", ".join(interests) if isinstance(interests, list) else str(interests)
            text = f"Researcher {p.get('name', '')}, Role: {p.get('role', '')}, Institution: {p.get('institution', '')}. Interests: {interests_str}"
            texts.append(text or "empty profile")

        # 5. Get embeddings from ML service
        try:
            response = requests.post(ML_SERVICE_URL, json={"text": texts})
            response.raise_for_status()
            vectors = response.json().get("vectors", [])
        except Exception as e:
            logger.error(f"ML Service error at batch {i}: {e}")
            continue

        # 6. Bulk update ES
        for j, p in enumerate(batch):
            try:
                doc = {
                    "id": p['id'],
                    "embedding": vectors[j]
                }
                es.index(index="profiles", id=p['id'], document=doc)
            except Exception as e:
                logger.error(f"ES index error for profile {p['id']}: {e}")

        logger.info(f"Processed batch {i//batch_size + 1}")
        time.sleep(0.1) # Rate limit

    cur.close()
    conn.close()
    logger.info("Batch embedding complete")

if __name__ == "__main__":
    batch_embed()
