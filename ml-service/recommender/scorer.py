import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def rrf_merge(cbf_results, cf_results, k=60):
    """
    Reciprocal Rank Fusion (RRF) to merge two ranked lists.
    Results format: list of (id, score) or just list of ids.
    Returns: list of (id, rrf_score) sorted by score.
    """
    scores = {}
    
    # Process CBF results
    for rank, item in enumerate(cbf_results):
        item_id = item[0] if isinstance(item, (list, tuple)) else item
        scores[item_id] = scores.get(item_id, 0) + (1.0 / (k + rank + 1))
        
    # Process CF results
    for rank, item in enumerate(cf_results):
        item_id = item[0] if isinstance(item, (list, tuple)) else item
        scores[item_id] = scores.get(item_id, 0) + (1.0 / (k + rank + 1))
        
    # Sort by RRF score descending
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_scores
