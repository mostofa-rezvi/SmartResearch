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

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/researchbridge")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_AUTH = os.getenv("NEO4J_AUTH", "neo4j/password").split("/")

class MatrixBuilder:
    def __init__(self):
        self.user_map = {} # userId -> row_idx
        self.item_map = {} # itemId -> col_idx
        self.interaction_matrix = None

    def fetch_interactions(self):
        interactions = [] # List of (user_id, item_id, weight)
        
        # 1. Fetch from Postgres
        try:
            conn = psycopg2.connect(DB_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Saved Papers (Weight: 2.0)
            cur.execute("SELECT user_id, paper_doi as item_id FROM saved_papers")
            for row in cur.fetchall():
                interactions.append((row['user_id'], row['item_id'], 2.0))
            
            # Votes (Weight: 1.0)
            cur.execute("SELECT user_id, post_id as item_id FROM votes WHERE value = 1")
            for row in cur.fetchall():
                interactions.append((row['user_id'], f"post_{row['item_id']}", 1.0))
                
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
                    interactions.append((record['u1'], f"user_{record['u2']}", record['w'] or 3.0))
            driver.close()
        except Exception as e:
            logger.error(f"Neo4j interaction fetch failed: {e}")

        return interactions

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
