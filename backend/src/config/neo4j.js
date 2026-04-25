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
  } catch (err) {
    console.error('Failed to initialize Neo4j driver', err);
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
  getSession,
  closeNeo4j
};
