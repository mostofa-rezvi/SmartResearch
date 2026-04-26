import asyncio
import os
import logging
from redis import asyncio as aioredis
from ml_model import get_model
from cache import get_cache
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
STREAM_NAME = "profile.created"
GROUP_NAME = "ml_workers"
CONSUMER_NAME = os.getenv("HOSTNAME", "ml_worker_1")

async def process_message(msg_id, data):
    try:
        model = get_model()
        cache = get_cache()
        
        # Extract profile data
        profile_id = data.get(b'id', b'').decode()
        text = data.get(b'text', b'').decode()
        
        if not text:
            logger.warning(f"Empty text for profile {profile_id}, skipping.")
            return True

        # Check cache first
        vector = cache.get(text)
        if not vector:
            # Generate embedding in thread
            vector = await asyncio.to_thread(model.encode, text)
            cache.set(text, vector)

        # TODO: Store in Elasticsearch (Task 6.5 will provide the client)
        logger.info(f"Generated embedding for profile {profile_id}")
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
