import asyncio
import os
import logging
import json
from redis import asyncio as aioredis
from cache import get_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
STREAM_NAME = "event.behaviour"
GROUP_NAME = "ml_behaviour_group"
CONSUMER_NAME = os.getenv("HOSTNAME", "ml_behaviour_worker_1")

async def process_behaviour_message(msg_id, data, builder, cf_engine):
    try:
        if b'payload' not in data:
            logger.warning(f"Message {msg_id} missing payload field, skipping.")
            return True
        
        payload_str = data[b'payload'].decode('utf-8')
        payload = json.loads(payload_str)
        
        event_type = payload.get('type')
        user_id = payload.get('userId')
        
        if not event_type or not user_id:
            logger.warning(f"Invalid payload in message {msg_id}: {payload_str}")
            return True
            
        user_id = int(user_id)
        item_id = None
        weight = 0.0
        
        if event_type == 'library.paper.saved':
            item_id = payload.get('doi')
            weight = 2.0
        elif event_type == 'community.comment.created':
            post_id = payload.get('postId')
            if post_id:
                item_id = f"post_{post_id}"
                weight = 1.5
        elif event_type == 'community.post.voted':
            post_id = payload.get('postId')
            value = payload.get('value')
            if post_id and value == 1:
                item_id = f"post_{post_id}"
                weight = 1.0
        elif event_type == 'community.post.shared':
            post_id = payload.get('postId')
            if post_id:
                item_id = f"post_{post_id}"
                weight = 0.5
                
        if item_id and weight > 0.0:
            logger.info(f"Recording interaction: user {user_id}, item {item_id}, weight {weight} (from event {event_type})")
            # Add interaction and rebuild matrix if debouncing condition is met
            rebuilt = builder.add_interaction(user_id, item_id, weight)
            if rebuilt:
                logger.info("Matrix rebuilt successfully. Recomputing user similarity matrix...")
                cf_engine.compute_user_similarity()
                
            # Always clear cache for this user since their recommendations should update
            cache = get_cache()
            cache.delete_rec(user_id)
            
        return True
    except Exception as e:
        logger.error(f"Error processing behaviour message {msg_id}: {str(e)}")
        return False

async def start_behaviour_worker(builder, cf_engine):
    logger.info(f"Starting ML Behaviour Worker consumer: {CONSUMER_NAME}")
    redis = await aioredis.from_url(REDIS_URL)

    # Ensure group exists
    try:
        await redis.xgroup_create(STREAM_NAME, GROUP_NAME, mkstream=True)
        logger.info(f"Created consumer group {GROUP_NAME} on stream {STREAM_NAME}")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            logger.info(f"Consumer group {GROUP_NAME} already exists")
        else:
            logger.error(f"Failed to create consumer group: {str(e)}")

    while True:
        try:
            # Read from stream
            # ">" means "messages that have never been delivered to any other consumer"
            messages = await redis.xreadgroup(
                GROUP_NAME, CONSUMER_NAME, {STREAM_NAME: ">"}, count=10, block=5000
            )

            for stream, msgs in messages:
                for msg_id, data in msgs:
                    success = await process_behaviour_message(msg_id, data, builder, cf_engine)
                    if success:
                        await redis.xack(STREAM_NAME, GROUP_NAME, msg_id)
                        logger.info(f"Acknowledged behaviour message {msg_id}")
                    else:
                        # Move to failed stream
                        await redis.xadd("event.behaviour.failed", data)
                        await redis.xack(STREAM_NAME, GROUP_NAME, msg_id)
                        logger.error(f"Behaviour message {msg_id} failed and moved to event.behaviour.failed")

        except Exception as e:
            logger.error(f"Behaviour worker loop error: {str(e)}")
            await asyncio.sleep(5)
