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
def test_post_interaction_bookmark_rebuilt(mock_builder, mock_cf, mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache
    mock_builder.add_interaction.return_value = True

    response = client.post("/interactions", json={
        "user_id": 1,
        "item_id": "paper_123",
        "action": "bookmark"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    
    mock_builder.add_interaction.assert_called_once_with(1, "paper_123", 2.0)
    mock_cf.compute_user_similarity.assert_called_once()
    mock_cache.delete_rec.assert_called_once_with(1)

@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.builder")
def test_post_interaction_comment_debounced(mock_builder, mock_cf, mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache
    mock_builder.add_interaction.return_value = False

    response = client.post("/interactions", json={
        "user_id": 2,
        "item_id": "post_456",
        "action": "comment"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    
    mock_builder.add_interaction.assert_called_once_with(2, "post_456", 1.5)
    mock_cf.compute_user_similarity.assert_not_called()
    mock_cache.delete_rec.assert_called_once_with(2)

@patch("main.get_cache")
@patch("main.cf_engine")
@patch("main.builder")
def test_post_interaction_upvote(mock_builder, mock_cf, mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache
    mock_builder.add_interaction.return_value = True

    response = client.post("/interactions", json={
        "user_id": 3,
        "item_id": "post_789",
        "action": "upvote"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    
    mock_builder.add_interaction.assert_called_once_with(3, "post_789", 1.0)
    mock_cf.compute_user_similarity.assert_called_once()
    mock_cache.delete_rec.assert_called_once_with(3)
