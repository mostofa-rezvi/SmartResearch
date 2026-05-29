import asyncio
import os
import logging
import time
from redis import asyncio as aioredis
from ml_model import get_model
from cache import get_cache
from elasticsearch import Elasticsearch
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
STREAM_NAME = "profile.created"
GROUP_NAME = "ml_workers"
CONSUMER_NAME = os.getenv("HOSTNAME", "ml_worker_1")

# Initialize ES client
es = Elasticsearch(ES_URL)

async def process_message(msg_id, data):
    try:
        model = get_model()
        cache = get_cache()
        
        # Extract profile data supporting both flat and JSON-stringified payloads
        if b'payload' in data:
            try:
                payload = json.loads(data[b'payload'].decode('utf-8'))
                profile_id = str(payload.get('id', ''))
                name = payload.get('name', 'Unknown')
                role = payload.get('role', '')
                institution = payload.get('institution', '') or payload.get('institution_name', '')
                interests = payload.get('interests', []) or payload.get('research_interests', [])
                if isinstance(interests, str):
                    try:
                        interests = json.loads(interests)
                    except Exception:
                        interests = [interests]
                elif not isinstance(interests, list):
                    interests = [interests] if interests else []
                
                text = f"Researcher {name}"
                if role:
                    text += f", Role: {role}"
                if institution:
                    text += f", Institution: {institution}"
                if interests:
                    text += f". Interests: {', '.join(str(i) for i in interests)}"
            except Exception as json_err:
                logger.error(f"JSON payload parse failed, falling back: {json_err}")
                profile_id = data.get(b'id', b'').decode('utf-8', errors='ignore')
                text = data.get(b'text', b'').decode('utf-8', errors='ignore')
        else:
            profile_id = data.get(b'id', b'').decode('utf-8', errors='ignore')
            text = data.get(b'text', b'').decode('utf-8', errors='ignore')
        
        if not text:
            logger.warning(f"Empty text for profile {profile_id}, skipping.")
            return True

        # Check cache first
        vector = cache.get(text)
        if not vector:
            # Generate embedding in thread
            vector = await asyncio.to_thread(model.encode, text)
            cache.set(text, vector)

        # Store in Elasticsearch
        try:
            es.index(index="profiles", id=profile_id, document={
                "id": profile_id,
                "embedding": vector,
                "updated_at": int(time.time() * 1000)
            })
            logger.info(f"Generated and stored embedding for profile {profile_id} in ES")
        except Exception as e:
            logger.error(f"Elasticsearch index error for profile {profile_id}: {str(e)}")
            return False

        return True
    except Exception as e:
        logger.error(f"Error processing message {msg_id}: {str(e)}")
        return False

async def main():
    logger.info(f"Starting ML Worker consumer: {CONSUMER_NAME}")
    redis = await aioredis.from_url(REDIS_URL)

    # Ensure group exists
    try:
        await redis.xgroup_create(STREAM_NAME, GROUP_NAME, mkstream=True)
        logger.info(f"Created consumer group {GROUP_NAME}")
    except Exception:
        logger.info(f"Consumer group {GROUP_NAME} already exists")

    while True:
        try:
            # Read from stream
            # ">" means "messages that have never been delivered to any other consumer"
            messages = await redis.xreadgroup(
                GROUP_NAME, CONSUMER_NAME, {STREAM_NAME: ">"}, count=10, block=5000
            )

            for stream, msgs in messages:
                for msg_id, data in msgs:
                    success = await process_message(msg_id, data)
                    if success:
                        await redis.xack(STREAM_NAME, GROUP_NAME, msg_id)
                        logger.info(f"Acknowledged message {msg_id}")
                    else:
                        # Move to failed stream (Dead Letter)
                        await redis.xadd("ml.failed", data)
                        await redis.xack(STREAM_NAME, GROUP_NAME, msg_id)
                        logger.error(f"Message {msg_id} failed and moved to ml.failed")

        except Exception as e:
            logger.error(f"Worker loop error: {str(e)}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
