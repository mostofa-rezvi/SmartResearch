import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from neo4j import GraphDatabase
from scipy.sparse import csr_matrix
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress Neo4j notifications/warnings (e.g., non-existent properties/relationships on empty database)
logging.getLogger("neo4j.notifications").setLevel(logging.ERROR)

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_AUTH = os.getenv("NEO4J_AUTH", "neo4j/password").split("/")

class MatrixBuilder:
    def __init__(self):
        self.user_map = {} # userId -> row_idx
        self.item_map = {} # itemId -> col_idx
        self.interaction_matrix = None
        self.interactions_raw = []
        self._pending_count = 0
        self._last_rebuild_time = 0

    def fetch_interactions(self):
        self.interactions_raw = [] # List of (user_id, item_id, weight)
        
        # 1. Fetch from Postgres
        try:
            conn = psycopg2.connect(DB_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Saved Papers (Weight: 2.0)
            cur.execute("SELECT user_id, paper_doi as item_id FROM saved_papers")
            for row in cur.fetchall():
                if row['item_id']:
                    self.interactions_raw.append((row['user_id'], row['item_id'], 2.0))
            
            # Votes (Weight: 1.0)
            cur.execute("SELECT user_id, post_id as item_id FROM votes WHERE value = 1")
            for row in cur.fetchall():
                if row['item_id']:
                    self.interactions_raw.append((row['user_id'], f"post_{row['item_id']}", 1.0))

            # Reading History (Weight based on action)
            cur.execute("SELECT user_id, paper_id as item_id, action FROM reading_history")
            for row in cur.fetchall():
                if row['item_id']:
                    weight = 0.5
                    if row['action'] == 'bookmark':
                        weight = 2.0
                    elif row['action'] == 'download':
                        weight = 3.0
                    self.interactions_raw.append((row['user_id'], row['item_id'], weight))
                
            cur.close()
            conn.close()
        except Exception as e:
            logger.error(f"Postgres interaction fetch failed: {e}")

        # 2. Fetch from Neo4j (SUPPORTS)
        try:
            driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_AUTH[0], NEO4J_AUTH[1]))
            with driver.session() as session:
                result = session.run("MATCH (r1:Researcher)-[s:SUPPORTS]->(r2:Researcher) RETURN r1.userId as u1, r2.userId as u2, s.weight as w")
                for record in result:
                    if record['u1'] and record['u2']:
                        self.interactions_raw.append((record['u1'], f"user_{record['u2']}", record['w'] or 3.0))
            driver.close()
        except Exception as e:
            logger.error(f"Neo4j interaction fetch failed: {e}")

        return self.interactions_raw

    def add_interaction(self, user_id, item_id, weight, force=False):
        # Prevent exact duplicates from dual-path delivery (HTTP + Redis stream)
        if (user_id, item_id, weight) in self.interactions_raw:
            return False
            
        self.interactions_raw.append((user_id, item_id, weight))
        self._pending_count += 1
        
        import time
        now = time.time()
        if force or self._pending_count >= 10 or (now - self._last_rebuild_time) >= 60:
            self.build_matrix(self.interactions_raw)
            self._pending_count = 0
            self._last_rebuild_time = now
            return True
        return False

    def build_matrix(self, interactions):
        if not interactions:
            return None

        # Build ID maps
        users = sorted(list(set(i[0] for i in interactions)))
        items = sorted(list(set(i[1] for i in interactions)))
        
        self.user_map = {uid: idx for idx, uid in enumerate(users)}
        self.item_map = {iid: idx for idx, iid in enumerate(items)}

        rows = [self.user_map[i[0]] for i in interactions]
        cols = [self.item_map[i[1]] for i in interactions]
        data = [i[2] for i in interactions]

        self.interaction_matrix = csr_matrix((data, (rows, cols)), shape=(len(users), len(items)))
        logger.info(f"Built interaction matrix: {self.interaction_matrix.shape}")
        return self.interaction_matrix

if __name__ == "__main__":
    builder = MatrixBuilder()
    data = builder.fetch_interactions()
    builder.build_matrix(data)
