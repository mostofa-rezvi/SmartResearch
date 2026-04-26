from sklearn.metrics.pairwise import cosine_similarity
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CFEngine:
    def __init__(self, matrix_builder):
        self.builder = matrix_builder
        self.similarity_matrix = None

    def compute_user_similarity(self):
        if self.builder.interaction_matrix is None:
            return None
        
        logger.info("Computing user-user similarity matrix...")
        # cosine_similarity works efficiently on sparse CSR matrices
        self.similarity_matrix = cosine_similarity(self.builder.interaction_matrix, dense_output=False)
        return self.similarity_matrix

    def get_recommendations(self, user_id, top_n=20):
        if self.builder.interaction_matrix is None or self.similarity_matrix is None:
            return []
            
        if user_id not in self.builder.user_map:
            logger.info(f"User {user_id} not in interaction matrix (Cold Start)")
            return []
            
        user_idx = self.builder.user_map[user_id]
        
        # Get similarities for this user
        user_sims = self.similarity_matrix[user_idx].toarray().flatten()
        # Find top similar users (excluding self)
        similar_users = np.argsort(user_sims)[::-1][1:11] # Top 10 peers
        
        # Aggregate items from similar users
        item_scores = {}
        for peer_idx in similar_users:
            peer_weight = user_sims[peer_idx]
            peer_interactions = self.builder.interaction_matrix[peer_idx].toarray().flatten()
            
            for item_idx, interaction_weight in enumerate(peer_interactions):
                if interaction_weight > 0:
                    item_id = list(self.builder.item_map.keys())[list(self.builder.item_map.values()).index(item_idx)]
                    item_scores[item_id] = item_scores.get(item_id, 0) + (peer_weight * interaction_weight)
                    
        # Sort and return
        sorted_items = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_items[:top_n]
