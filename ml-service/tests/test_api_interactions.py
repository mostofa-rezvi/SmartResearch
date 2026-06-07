from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
import pytest
from unittest.mock import patch, MagicMock

client = TestClient(app)

@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.builder")
def test_post_interaction(mock_builder, mock_cf, mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache

    # Post a mock interaction
    response = client.post("/interactions", json={
        "user_id": 1,
        "item_id": "paper_123",
        "action": "bookmark"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    
    # Verify add_interaction was called with user_id, item_id, and weight
    mock_builder.add_interaction.assert_called_once_with(1, "paper_123", 2.0)
    # Verify similarity matrix recomputed
    mock_cf.compute_user_similarity.assert_called_once()
    # Verify cache cleared for user
    mock_cache.delete_rec.assert_called_once_with(1)
