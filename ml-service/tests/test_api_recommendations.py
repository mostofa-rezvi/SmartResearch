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
    # Use a high score so it passes the threshold
    mock_rrf.return_value = [("user_202", 0.99), ("user_203", 0.95), ("user_204", 0.94), ("user_205", 0.93), ("user_206", 0.92)]
    
    response = client.post("/recommendations/1")
    assert response.status_code == 200
    data = response.json()
    assert data["cached"] is False
    assert data["recommendations"][0][0] == "user_202"
    
    # Verify it was cached
    mock_cache.set_rec.assert_called_once()

@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.rrf_merge")
def test_get_recommendations_filtering(mock_rrf, mock_cf, mock_get_cache):
    # Mock cache miss
    mock_cache = MagicMock()
    mock_cache.get_rec.return_value = None
    mock_get_cache.return_value = mock_cache
    
    # Mock engines
    # High score user_good, low score user_bad
    mock_rrf.return_value = [("user_good", 0.99), ("user_bad", 0.01), ("user_good2", 0.98), ("user_good3", 0.97), ("user_good4", 0.96)]
    
    response = client.post("/recommendations/1")
    assert response.status_code == 200
    data = response.json()
    
    # Verify the low score was filtered out
    recommendations = data["recommendations"]
    returned_users = [rec[0] for rec in recommendations]
    assert "user_good" in returned_users
    assert "user_bad" not in returned_users

@patch("main.psycopg2")
@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.rrf_merge")
def test_get_recommendations_fallback(mock_rrf, mock_cf, mock_get_cache, mock_psycopg2):
    # Mock cache miss
    mock_cache = MagicMock()
    mock_cache.get_rec.return_value = None
    mock_get_cache.return_value = mock_cache
    
    # Mock RRF returning all low scores (all get filtered out)
    mock_rrf.return_value = [("user_bad1", 0.01), ("user_bad2", 0.02)]
    
    # Mock psycopg2
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    # Return mock db rows for fallback
    mock_cur.fetchall.return_value = [(10, 5000), (11, 4000), (12, 3000), (13, 2000), (14, 1000)]
    mock_conn.cursor.return_value = mock_cur
    mock_psycopg2.connect.return_value = mock_conn

    response = client.post("/recommendations/1")
    assert response.status_code == 200
    data = response.json()
    
    # Assert we hit the DB fallback
    mock_psycopg2.connect.assert_called_once()
    mock_cur.execute.assert_called_once()
    
    # Assert fallback users are in the results
    recommendations = data["recommendations"]
    returned_users = [rec[0] for rec in recommendations]
    assert 10 in returned_users
    assert 11 in returned_users
