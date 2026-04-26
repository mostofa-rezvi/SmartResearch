const neo4j = require('neo4j-driver');
const config = require('./index');

let driver;

/**
 * Initializes the Neo4j Trust-Graph Driver connection.
 */
const initNeo4j = () => {
  const uri = config.neo4j.uri;
  const [user, password] = config.neo4j.auth.split('/');

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log('Neo4j Trust-Graph Driver initialized attached to ML pipeline.');
    
    // Asynchronously init constraints
    initConstraints().catch(err => console.error('Failed to init Neo4j constraints', err));
  } catch (err) {
    console.error('Failed to initialize Neo4j driver', err);
  }
};

/**
 * Initializes Neo4j constraints to ensure uniqueness of node IDs.
 */
const initConstraints = async () => {
  if (!driver) return;
  const session = driver.session();
  try {
    const queries = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (r:Researcher) REQUIRE r.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (i:Institution) REQUIRE i.id IS UNIQUE',
    ];
    for (const query of queries) {
      await session.run(query);
    }
    console.log('Neo4j constraints verified.');
  } finally {
    await session.close();
  }
};

/**
 * Retrieves an active session for the Trust-Graph to perform TrustRank traversals.
 */
const getSession = () => {
  if (!driver) {
    throw new Error('Neo4j Driver not initialized');
  }
  return driver.session();
};

/**
 * Gracefully shuts down the graph driver.
 */
const closeNeo4j = async () => {
  if (driver) {
    await driver.close();
  }
};

module.exports = {
  initNeo4j,
  initConstraints,
  getSession,
  closeNeo4j
};
