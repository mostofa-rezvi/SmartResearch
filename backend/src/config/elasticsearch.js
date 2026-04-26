const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');
const config = require('./index');

let esClient;

/**
 * Initializes the Elasticsearch client for advanced research discovery.
 */
const initElasticsearch = () => {
  const node = config.elasticsearch.node;

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
 * Creates indices with dense_vector mappings if they do not exist.
 */
const initIndices = async () => {
  if (!esClient) return;
  
  const indexConfigs = {
    users: {
      mappings: {
        properties: {
          name: { type: 'text' },
          email: { type: 'keyword' },
          content: { type: 'text' }, // Bio
          embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' }
        }
      }
    },
    papers: {
      mappings: {
        properties: {
          title: { type: 'text' },
          abstract: { type: 'text' },
          authors: { type: 'keyword' },
          tags: { type: 'keyword' },
          embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' }
        }
      }
    },
    projects: {
      mappings: {
        properties: {
          title: { type: 'text' },
          description: { type: 'text' },
          tags: { type: 'keyword' },
          embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' }
        }
      }
    }
  };

  for (const [indexName, mappingBody] of Object.entries(indexConfigs)) {
    try {
      const exists = await esClient.indices.exists({ index: indexName });
      if (!exists) {
        await esClient.indices.create({
          index: indexName,
          body: mappingBody
        });
        logger.info(`Created Elasticsearch index: ${indexName} with specific vector mappings`);
      }
    } catch (err) {
      logger.error(`Failed to create index ${indexName}:`, err);
    }
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
  initIndices,
  getEsClient
};
