import logging
from typing import List, Union
import numpy as np
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to load SentenceTransformer locally, catch PyTorch DLL/environment failures
HAS_LOCAL_MODEL = False
try:
    from sentence_transformers import SentenceTransformer
    HAS_LOCAL_MODEL = True
except Exception as e:
    logger.warning(f"⚠️ Failed to load local SentenceTransformer/PyTorch: {e}")
    logger.info("ℹ️ Switching to Hugging Face Inference API / Mock Fallback.")

class MLModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModel, cls).__new__(cls)
            cls._instance.use_fallback = not HAS_LOCAL_MODEL
            
            if HAS_LOCAL_MODEL:
                try:
                    logger.info("Initializing SBERT model locally: all-mpnet-base-v2")
                    cls._instance.model = SentenceTransformer('all-mpnet-base-v2')
                    cls._instance.warmup()
                    logger.info("Model loaded and warmed up locally.")
                except Exception as local_err:
                    logger.error(f"Error initializing local SBERT model: {local_err}")
                    cls._instance.use_fallback = True
            
            if cls._instance.use_fallback:
                logger.info("Using Hugging Face Inference API for all-mpnet-base-v2 embeddings.")
        return cls._instance

    def warmup(self):
        """Warmup the model with a dummy encoding."""
        if not self.use_fallback:
            try:
                logger.info("Warming up model...")
                self.model.encode("warmup sentence")
            except Exception as e:
                logger.error(f"Warmup failed: {e}")

    def encode(self, text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """Encode text into 768-dim vectors using local model or API fallback."""
        if not self.use_fallback:
            try:
                embeddings = self.model.encode(text)
                if hasattr(embeddings, 'tolist'):
                    return embeddings.tolist()
                return embeddings
            except Exception as e:
                logger.error(f"Local encoding failed: {e}. Falling back to API.")
        
        # Hugging Face Inference API Fallback
        # Free public endpoint for all-mpnet-base-v2
        url = "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2"
        headers = {} # No token required for public rate-limited use
        
        try:
            texts = [text] if isinstance(text, str) else text
            response = requests.post(url, headers=headers, json={"inputs": texts}, timeout=8)
            if response.status_code == 200:
                result = response.json()
                # API returns list of lists of floats
                if isinstance(text, str):
                    return result[0]
                return result
            else:
                logger.warning(f"HF Inference API returned status {response.status_code}: {response.text}")
        except Exception as api_err:
            logger.error(f"HF Inference API request failed: {api_err}")
            
        # Hard Mock Fallback if internet is offline or API fails
        logger.warning("Using Deterministic Vector Mock Fallback (Offline).")
        dim = 768
        if isinstance(text, str):
            import hashlib
            seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16) % (2**32)
            rng = np.random.default_rng(seed)
            return rng.random(dim).tolist()
        else:
            results = []
            for t in text:
                import hashlib
                seed = int(hashlib.md5(t.encode('utf-8')).hexdigest(), 16) % (2**32)
                rng = np.random.default_rng(seed)
                results.append(rng.random(dim).tolist())
            return results

def get_model():
    return MLModel()

