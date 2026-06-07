import asyncio
import os
import sys

# Ensure we can import from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import get_recommendations, RecRequest

async def run_verification():
    print(f"--- UAT VERIFICATION: SBERT Recommendation Threshold ---")
    threshold = os.getenv("RECOMMENDATION_THRESHOLD", "0.5332")
    print(f"Active Threshold (RECOMMENDATION_THRESHOLD): {threshold}")
    
    # Simulate a user profile searching for biology
    print("\nSimulating user profile text: 'Deep learning neural networks AI'")
    req = RecRequest(profile_text="Deep learning neural networks AI")
    
    # Mock get_cache to bypass caching
    try:
        from unittest.mock import patch, MagicMock
        with patch('main.get_cache') as mock_cache_func, \
             patch('main.cf_engine') as mock_cf, \
             patch('main.rrf_merge') as mock_rrf, \
             patch('main.psycopg2.connect') as mock_db:
             
            mock_cache = MagicMock()
            mock_cache.get_rec.return_value = None
            mock_cache_func.return_value = mock_cache
            
            # Mock CF to return nothing
            mock_cf.get_recommendations.return_value = []
            
            # Scenario A: RRF returns extremely relevant matches and completely irrelevant matches
            print("\nScenario A: Engine finds highly relevant and highly irrelevant matches")
            mock_rrf.return_value = [
                ("User_Relevant_1 (AI)", 0.85),
                ("User_Relevant_2 (ML)", 0.65),
                ("User_Relevant_3 (Deep Learning)", 0.58),
                ("User_Relevant_4 (Vision)", 0.55),
                ("User_Relevant_5 (NLP)", 0.54),
                ("User_Irrelevant_1 (History)", 0.25),
                ("User_Irrelevant_2 (Biology)", 0.15)
            ]
            
            result = await get_recommendations(user_id=1, req=req)
            recs = result['recommendations']
            
            print("Filtered Results:")
            for rec in recs:
                print(f" - {rec[0]}: {rec[1]:.4f}")
            
            # Verify no irrelevant matches slipped through
            irrelevant = [r for r in recs if "Irrelevant" in r[0]]
            if len(irrelevant) == 0:
                print("✓ PASS: Irrelevant matches (score < cutoff) successfully filtered!")
            else:
                print("✗ FAIL: Irrelevant matches bypassed the filter!")
                
            # Scenario B: Cold Start Fallback
            print("\nScenario B: Engine finds only irrelevant matches (e.g. strict cutoff)")
            mock_rrf.return_value = [
                ("User_Irrelevant_1 (History)", 0.25),
                ("User_Irrelevant_2 (Biology)", 0.15)
            ]
            
            # Mock DB Fallback
            mock_conn = MagicMock()
            mock_cur = MagicMock()
            mock_cur.fetchall.return_value = [(101, 5000), (102, 4000), (103, 3000), (104, 2000), (105, 1000)]
            mock_conn.cursor.return_value = mock_cur
            mock_db.return_value = mock_conn
            
            result_b = await get_recommendations(user_id=1, req=req)
            recs_b = result_b['recommendations']
            
            print("Fallback Results (Top Cited):")
            for rec in recs_b:
                print(f" - User ID {rec[0]} (Dummy Score: {rec[1]:.4f})")
                
            if len(recs_b) == 5:
                print("✓ PASS: System fell back to PostgreSQL popular researchers when < 5 ML matches passed!")
            else:
                print("✗ FAIL: Fallback mechanism did not trigger correctly.")

    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    asyncio.run(run_verification())
