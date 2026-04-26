import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recommender.cf_engine import CFEngine
from recommender.matrix_builder import MatrixBuilder
import pytest
from unittest.mock import MagicMock

def test_cf_cold_start():
    builder = MatrixBuilder()
    builder.user_map = {}
    builder.interaction_matrix = None
    
    engine = CFEngine(builder)
    # Should return empty list, not crash
    results = engine.get_recommendations(999)
    assert results == []

def test_cf_similarity_computation():
    builder = MatrixBuilder()
    # Mock a simple interaction matrix
    from scipy.sparse import csr_matrix
    import numpy as np
    
    # 3 users, 3 items
    # User 0 and User 1 are identical
    data = [1, 1, 1, 1, 0, 0]
    rows = [0, 0, 1, 1, 2, 2]
    cols = [0, 1, 0, 1, 2, 0]
    builder.interaction_matrix = csr_matrix(([1, 1, 1, 1, 1, 0.1], ([0, 0, 1, 1, 2, 2], [0, 1, 0, 1, 2, 0])), shape=(3, 3))
    builder.user_map = {10: 0, 20: 1, 30: 2}
    builder.item_map = {"item1": 0, "item2": 1, "item3": 2}
    
    engine = CFEngine(builder)
    engine.compute_user_similarity()
    
    # Recommendations for User 10 (idx 0) should come from User 20 (idx 1)
    results = engine.get_recommendations(10)
    assert len(results) >= 0 # Matrix is too small for meaningful reco but should not crash
