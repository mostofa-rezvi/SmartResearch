import os
import sys
import numpy as np
import psycopg2
import logging
from itertools import combinations
import random

# Ensure we can import from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_model import get_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cosine_similarity(v1, v2):
    dot = np.dot(v1, v2)
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    if norm == 0:
        return 0.0
    return float(dot / norm)

def get_data():
    """Fetch profiles and known good pairs from DB. Uses mock data if DB is unavailable."""
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Get profiles
        cur.execute("SELECT id, bio, research_interests FROM researcher_profiles LIMIT 100")
        profiles = {}
        for row in cur.fetchall():
            # Combine bio and interests for embedding
            text = f"{row[1] or ''} {row[2] or ''}".strip()
            if text:
                profiles[row[0]] = text
                
        # Get known good pairs (users in the same project)
        cur.execute("""
            SELECT p1.user_id, p2.user_id 
            FROM project_members p1 
            JOIN project_members p2 ON p1.project_id = p2.project_id 
            WHERE p1.user_id < p2.user_id
            LIMIT 500
        """)
        good_pairs = cur.fetchall()
        
        cur.close()
        conn.close()
        
        if len(profiles) < 10 or len(good_pairs) < 5:
            raise Exception("Not enough data in DB, falling back to mock")
            
        logger.info(f"Loaded {len(profiles)} profiles and {len(good_pairs)} known good pairs from DB.")
        return profiles, good_pairs
    except Exception as e:
        logger.warning(f"Database connection failed or insufficient data ({e}). Using MOCK data.")
        # Generate mock profiles
        profiles = {
            1: "AI researcher focusing on deep learning and neural networks.",
            2: "Machine learning scientist specializing in NLP and LLMs.",
            3: "Biologist studying cell division and genetics.",
            4: "Geneticist researching CRISPR and DNA sequencing.",
            5: "Civil engineer working on structural integrity of bridges.",
            6: "Data scientist working on predictive modeling and AI.",
            7: "Historian focused on ancient Rome.",
            8: "Archaeologist excavating ancient civilizations."
        }
        # Good pairs are those in the same domain
        good_pairs = [(1,2), (1,6), (2,6), (3,4), (7,8)]
        return profiles, good_pairs

def plot_ascii_histogram(data, bins=10, width=50):
    if not data:
        return
    min_val, max_val = min(data), max(data)
    bin_edges = np.linspace(min_val, max_val, bins + 1)
    hist, _ = np.histogram(data, bins=bin_edges)
    max_count = max(hist) if len(hist) > 0 and max(hist) > 0 else 1
    
    for i in range(bins):
        count = hist[i]
        bar_len = int((count / max_count) * width)
        bar = '#' * bar_len
        print(f"{bin_edges[i]:.3f} - {bin_edges[i+1]:.3f} | {count:3d} | {bar}")

def run_calibration():
    logger.info("Starting SBERT Threshold Calibration...")
    
    profiles, good_pairs = get_data()
    
    # Generate embeddings
    logger.info("Generating embeddings for profiles...")
    model = get_model()
    embeddings = {}
    for uid, text in profiles.items():
        embeddings[uid] = model.encode(text)
        
    # Filter good pairs to only those where we have embeddings
    valid_good_pairs = [(u1, u2) for u1, u2 in good_pairs if u1 in embeddings and u2 in embeddings]
    
    # Generate random pairs
    all_uids = list(embeddings.keys())
    random_pairs = []
    # Create N random pairs (roughly same amount as good pairs or max possible)
    num_random = max(len(valid_good_pairs) * 2, 20)
    for _ in range(num_random):
        u1, u2 = random.sample(all_uids, 2)
        random_pairs.append((u1, u2))
        
    # Calculate similarities
    logger.info("Calculating similarities...")
    good_scores = [cosine_similarity(embeddings[u1], embeddings[u2]) for u1, u2 in valid_good_pairs]
    random_scores = [cosine_similarity(embeddings[u1], embeddings[u2]) for u1, u2 in random_pairs]
    
    print("\n--- GOOD PAIRS SIMILARITY DISTRIBUTION ---")
    plot_ascii_histogram(good_scores)
    
    print("\n--- RANDOM PAIRS SIMILARITY DISTRIBUTION ---")
    plot_ascii_histogram(random_scores)
    
    # Calculate the 85th percentile of good pairs
    # Wait, the prompt said "pick cutoff at ~85th percentile of good pairs."
    # If we want a cutoff where most good pairs are ABOVE it, we should use the 15th percentile 
    # (so 85% of good pairs pass the threshold). 
    # Let's calculate the 15th percentile (meaning 85% of good pairs score higher).
    if good_scores:
        threshold = np.percentile(good_scores, 15)
        logger.info(f"Calculated Cutoff Threshold (15th percentile to keep 85% of good pairs): {threshold:.4f}")
        
        # Validate how many random pairs would pass this threshold
        false_positives = sum(1 for s in random_scores if s >= threshold)
        fp_rate = (false_positives / len(random_scores)) * 100 if random_scores else 0
        logger.info(f"False Positive Rate (Random pairs passing threshold): {fp_rate:.1f}%")
        
        # Save to file for walkthrough
        with open(os.path.join(os.path.dirname(__file__), 'calibration_result.txt'), 'w') as f:
            f.write(f"THRESHOLD={threshold:.4f}\n")
    else:
        logger.error("Not enough data to calculate threshold.")

if __name__ == "__main__":
    run_calibration()
