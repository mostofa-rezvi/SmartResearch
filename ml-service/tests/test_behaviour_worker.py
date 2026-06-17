import sys
import os
import time
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from workers.behaviour_worker import process_behaviour_message
from recommender.matrix_builder import MatrixBuilder

@pytest.mark.asyncio
@patch("workers.behaviour_worker.get_cache")
async def test_process_behaviour_message_library_saved(mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache
    
    mock_builder = MagicMock()
    mock_builder.add_interaction.return_value = True # Simulate matrix rebuilt
    mock_cf_engine = MagicMock()
    
    # Message data from eventBus.emitEvent('event.behaviour', { type: 'library.paper.saved', userId: 1, doi: '10.1000/xyz123' })
    msg_data = {
        b'payload': b'{"type": "library.paper.saved", "userId": 1, "doi": "10.1000/xyz123"}'
    }
    
    success = await process_behaviour_message(b'123-0', msg_data, mock_builder, mock_cf_engine)
    assert success is True
    
    mock_builder.add_interaction.assert_called_once_with(1, '10.1000/xyz123', 2.0)
    mock_cf_engine.compute_user_similarity.assert_called_once()
    mock_cache.delete_rec.assert_called_once_with(1)

@pytest.mark.asyncio
@patch("workers.behaviour_worker.get_cache")
async def test_process_behaviour_message_comment_created(mock_get_cache):
    mock_cache = MagicMock()
    mock_get_cache.return_value = mock_cache
    
    mock_builder = MagicMock()
    mock_builder.add_interaction.return_value = False # Debounced
    mock_cf_engine = MagicMock()
    
    msg_data = {
        b'payload': b'{"type": "community.comment.created", "userId": 2, "postId": 456}'
    }
    
    success = await process_behaviour_message(b'123-1', msg_data, mock_builder, mock_cf_engine)
    assert success is True
    
    mock_builder.add_interaction.assert_called_once_with(2, 'post_456', 1.5)
    mock_cf_engine.compute_user_similarity.assert_not_called()
    mock_cache.delete_rec.assert_called_once_with(2)

def test_matrix_builder_debouncing():
    builder = MatrixBuilder()
    builder.interactions_raw = []
    
    # Mock build_matrix to see if it gets called
    builder.build_matrix = MagicMock()
    
    # 1. Add first interaction (not forced)
    # Should not trigger rebuild unless 60s has elapsed, but we initialized _last_rebuild_time to 0.
    # To test debouncing properly, let's set _last_rebuild_time to current time.
    builder._last_rebuild_time = time.time()
    
    rebuilt = builder.add_interaction(1, "paper_A", 1.0)
    assert rebuilt is False
    builder.build_matrix.assert_not_called()
    assert builder._pending_count == 1
    
    # 2. Add 9 more interactions (pending count reaches 10)
    for i in range(8):
        rebuilt = builder.add_interaction(1, f"paper_{i}", 1.0)
        assert rebuilt is False
        
    builder.build_matrix.assert_not_called()
    assert builder._pending_count == 9
    
    # The 10th interaction triggers rebuild
    rebuilt = builder.add_interaction(1, "paper_trigger", 1.0)
    assert rebuilt is True
    builder.build_matrix.assert_called_once()
    assert builder._pending_count == 0

def test_matrix_builder_duplicate_prevention():
    builder = MatrixBuilder()
    builder.interactions_raw = []
    builder._last_rebuild_time = time.time()
    
    builder.build_matrix = MagicMock()
    
    # Add first time
    rebuilt = builder.add_interaction(1, "paper_A", 2.0)
    assert rebuilt is False
    assert len(builder.interactions_raw) == 1
    
    # Add second time (exact duplicate)
    rebuilt_dup = builder.add_interaction(1, "paper_A", 2.0)
    assert rebuilt_dup is False
    assert len(builder.interactions_raw) == 1
    
    # Add different weight
    rebuilt_diff_wt = builder.add_interaction(1, "paper_A", 3.0)
    assert rebuilt_diff_wt is False
    assert len(builder.interactions_raw) == 2
