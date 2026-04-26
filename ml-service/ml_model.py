from sentence_transformers import SentenceTransformer
import logging
from typing import List, Union
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            logger.info("Initializing SBERT model: all-mpnet-base-v2")
            cls._instance = super(MLModel, cls).__new__(cls)
            # Load the 768-dim model
            cls._instance.model = SentenceTransformer('all-mpnet-base-v2')
            cls._instance.warmup()
            logger.info("Model loaded and warmed up")
        return cls._instance

    def warmup(self):
        """Warmup the model with a dummy encoding."""
        logger.info("Warming up model...")
        self.model.encode("warmup sentence")

    def encode(self, text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """Encode text into 768-dim vectors."""
        embeddings = self.model.encode(text)
        if isinstance(text, str):
            return embeddings.tolist()
        return embeddings.tolist()

def get_model():
    return MLModel()
