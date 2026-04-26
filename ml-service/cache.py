import hashlib
import redis
import numpy as np
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurable via environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MODEL_VERSION = "mpnet-v1"

class EmbeddingCache:
    def __init__(self):
        try:
            self.redis = redis.from_url(REDIS_URL)
            logger.info(f"Connected to Redis cache at {REDIS_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self.redis = None

    def _get_key(self, text: str) -> str:
        # Normalize text and hash it
        clean_text = text.strip().lower()
        text_hash = hashlib.sha256(clean_text.encode()).hexdigest()
        return f"emb:{MODEL_VERSION}:{text_hash}"

    def get(self, text: str):
        if not self.redis:
            return None
        
        key = self._get_key(text)
        data = self.redis.get(key)
        
        if data:
            logger.info(f"Cache hit for key: {key}")
            # Convert binary back to list
            return np.frombuffer(data, dtype=np.float32).tolist()
        return None

    def set(self, text: str, vector: list):
        if not self.redis:
            return
        
        key = self._get_key(text)
        # Store as binary for efficiency
        binary_data = np.array(vector, dtype=np.float32).tobytes()
        self.redis.set(key, binary_data, ex=60*60*24*7) # 7 day TTL
        logger.info(f"Cached embedding for key: {key}")

    def get_rec(self, user_id: int):
        if not self.redis:
            return None
        key = f"rec:v1:{user_id}"
        data = self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    def set_rec(self, user_id: int, results: list):
        if not self.redis:
            return
        key = f"rec:v1:{user_id}"
        # Cache for 1 hour
        self.redis.set(key, json.dumps(results), ex=3600)
        logger.info(f"Cached recommendations for user {user_id}")

# Singleton instance
_cache = EmbeddingCache()

def get_cache():
    return _cache
