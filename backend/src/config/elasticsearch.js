const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

let esClient;

/**
 * Initializes the Elasticsearch client for advanced research discovery.
 */
const initElasticsearch = () => {
  const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

  try {
    esClient = new Client({
      node,
      maxRetries: 3,
      requestTimeout: 60000,
    });

    logger.info(`Elasticsearch client initialized at ${node}`);
  } catch (err) {
    logger.error('Failed to initialize Elasticsearch client', err);
  }
};

/**
 * Returns the active Elasticsearch client.
 */
const getEsClient = () => {
  if (!esClient) {
    throw new Error('Elasticsearch client not initialized');
  }
  return esClient;
};

module.exports = {
  initElasticsearch,
  getEsClient
};
