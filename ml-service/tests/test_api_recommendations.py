from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
import pytest
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@patch("main.get_cache")
@patch("main.cf_engine")
def test_get_recommendations_cached(mock_cf, mock_get_cache):
    # Mock cache hit
    mock_cache = MagicMock()
    mock_cache.get_rec.return_value = [["user_101", 0.05]]
    mock_get_cache.return_value = mock_cache
    
    response = client.post("/recommendations/1")
    assert response.status_code == 200
    data = response.json()
    assert data["cached"] is True
    assert data["recommendations"][0][0] == "user_101"

@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.rrf_merge")
def test_get_recommendations_miss(mock_rrf, mock_cf, mock_get_cache):
    # Mock cache miss
    mock_cache = MagicMock()
    mock_cache.get_rec.return_value = None
    mock_get_cache.return_value = mock_cache
    
    # Mock engines
    mock_cf.get_recommendations.return_value = [("user_202", 0.1)]
    mock_rrf.return_value = [("user_202", 0.03)]
    
    response = client.post("/recommendations/1")
    assert response.status_code == 200
    data = response.json()
    assert data["cached"] is False
    assert data["recommendations"][0][0] == "user_202"
    
    # Verify it was cached
    mock_cache.set_rec.assert_called_once()
