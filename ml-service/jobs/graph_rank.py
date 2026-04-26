import os
import logging
from neo4j import GraphDatabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_AUTH = os.getenv("NEO4J_AUTH", "neo4j/password").split("/")

class GraphRanker:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_AUTH[0], NEO4J_AUTH[1]))

    def run_pagerank(self):
        with self.driver.session() as session:
            try:
                logger.info("Dropping existing projection if any...")
                session.run("CALL gds.graph.drop('trustGraph', false)")
                
                logger.info("Projecting trust graph...")
                session.run("""
                    CALL gds.graph.project(
                        'trustGraph',
                        ['Researcher', 'Paper'],
                        {
                            SUPPORTS: {orientation: 'NATURAL'},
                            CITES: {orientation: 'NATURAL'},
                            ENDORSES: {orientation: 'NATURAL'},
                            AUTHORED: {orientation: 'UNDIRECTED'}
                        }
                    )
                """)
                
                logger.info("Running PageRank...")
                session.run("""
                    CALL gds.pageRank.write('trustGraph', {
                        writeProperty: 'impactScore',
                        maxIterations: 20,
                        dampingFactor: 0.85
                    })
                """)
                
                logger.info("Updating Top Contributor badges...")
                # Normalize and find 95th percentile (simplified logic for MVP)
                session.run("""
                    MATCH (r:Researcher)
                    WITH r, r.impactScore as score
                    ORDER BY score DESC
                    LIMIT 10
                    SET r.isTopContributor = true
                """)
                
                logger.info("Graph PageRank completed successfully.")
                
            except Exception as e:
                logger.error(f"PageRank execution failed: {e}")
            finally:
                session.close()

    def close(self):
        self.driver.close()

if __name__ == "__main__":
    ranker = GraphRanker()
    ranker.run_pagerank()
    ranker.close()
