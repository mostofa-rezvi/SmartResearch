import sys
import os
# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recommender.scorer import rrf_merge

def test_rrf_merge_overlapping():
    cbf = ["A", "B", "C"]
    cf = ["B", "A", "D"]
    # RRF(A) = 1/(60+1) + 1/(60+2)
    # RRF(B) = 1/(60+2) + 1/(60+1)
    # RRF(C) = 1/(60+3)
    # RRF(D) = 1/(60+3)
    
    results = rrf_merge(cbf, cf)
    assert results[0][0] in ["A", "B"]
    assert results[1][0] in ["A", "B"]
    assert len(results) == 4

def test_rrf_merge_no_overlap():
    cbf = ["A", "B"]
    cf = ["C", "D"]
    results = rrf_merge(cbf, cf)
    assert len(results) == 4
    # All should have same score if ranks are same
    assert results[0][1] == results[1][1]

def test_rrf_with_scores():
    # Test that it handles (id, score) tuples too
    cbf = [("A", 0.9), ("B", 0.8)]
    cf = [("C", 0.7), ("A", 0.6)]
    results = rrf_merge(cbf, cf)
    assert results[0][0] == "A"
    assert len(results) == 3
