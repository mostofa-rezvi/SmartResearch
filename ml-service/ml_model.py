import os
import logging
from typing import List, Union
import numpy as np
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# HF Inference config (used when the local SBERT model is unavailable)
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_EMBEDDING_MODEL = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2")
HF_FEATURE_URL = (
    f"https://router.huggingface.co/hf-inference/models/{HF_EMBEDDING_MODEL}"
    "/pipeline/feature-extraction"
)

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
            # Provenance of the most recent encode(): "local" | "hf_api" | "mock"
            cls._instance.source = "local"
            # R2: True when the last encode() returned meaningless hash-random vectors
            cls._instance.degraded = False

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
                if HF_API_TOKEN:
                    logger.info(f"Using Hugging Face Inference API for embeddings ({HF_EMBEDDING_MODEL}).")
                else:
                    logger.warning(
                        "Local model unavailable AND HF_API_TOKEN not set — embeddings will use "
                        "the DEGRADED deterministic mock. Set HF_API_TOKEN for real semantic vectors."
                    )
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
        """Encode text into 768-dim vectors using local model or HF API fallback.

        Updates self.source ("local"|"hf_api"|"mock") and self.degraded so callers
        (e.g. /embed) can surface when results are the meaningless mock fallback (R2).
        """
        if not self.use_fallback:
            try:
                embeddings = self.model.encode(text)
                self.source, self.degraded = "local", False
                if hasattr(embeddings, 'tolist'):
                    return embeddings.tolist()
                return embeddings
            except Exception as e:
                logger.error(f"Local encoding failed: {e}. Falling back to HF API.")

        # ── Hugging Face Inference API fallback (real embeddings) ──────────────
        if HF_API_TOKEN:
            headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json"}
            try:
                texts = [text] if isinstance(text, str) else text
                response = requests.post(HF_FEATURE_URL, headers=headers, json={"inputs": texts}, timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    self.source, self.degraded = "hf_api", False
                    # API returns a list of embedding vectors (one per input)
                    return result[0] if isinstance(text, str) else result
                logger.warning(f"HF Inference API returned status {response.status_code}: {response.text[:200]}")
            except Exception as api_err:
                logger.error(f"HF Inference API request failed: {api_err}")
        else:
            logger.warning("HF_API_TOKEN not set — cannot use real embedding fallback.")

        # ── Hard mock fallback (offline / API failed): DEGRADED, meaningless vectors ──
        logger.warning("⚠️ DEGRADED: using deterministic hash-based mock embeddings (semantic quality is meaningless).")
        self.source, self.degraded = "mock", True
        dim = 768
        if isinstance(text, str):
            return self._mock_vector(text, dim)
        return [self._mock_vector(t, dim) for t in text]

    @staticmethod
    def _mock_vector(text: str, dim: int) -> List[float]:
        import hashlib
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16) % (2**32)
        rng = np.random.default_rng(seed)
        return rng.random(dim).tolist()


def get_model():
    return MLModel()
