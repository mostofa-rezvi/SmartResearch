const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');

const { getEsClient } = require('../config/elasticsearch');
const { getSession } = require('../config/neo4j');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class DiscoveryService {
  async vectorizeQuery(queryText) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/embed`, {
        text: queryText
      });
      return response.data.embedding;
    } catch (err) {
      logger.error('Query vectorization failed', err);
      return null;
    }
  }

  async getSuggestedCollaborators(userId) {
    const session = getSession();
    try {
      const query = `
        MATCH (me:Researcher {userId: $userId})-[:AUTHORED]->(p1:Paper)<-[:AUTHORED]-(collab:Researcher)-[:AUTHORED]->(p2:Paper)<-[:AUTHORED]-(suggested:Researcher)
        WHERE me <> suggested
        AND NOT (me)-[:AUTHORED]->()<-[:AUTHORED]-(suggested)
        RETURN suggested.userId as userId, 
               suggested.name as name, 
               count(DISTINCT collab) as sharedCollabs,
               collect(DISTINCT collab.name)[0..3] as exampleCollabs
        ORDER BY sharedCollabs DESC
        LIMIT 10
      `;
      
      const result = await session.run(query, { userId: parseInt(userId) });
      
      return result.records.map(record => ({
        userId: record.get('userId').toNumber(),
        name: record.get('name'),
        sharedCollabs: record.get('sharedCollabs').toNumber(),
        exampleCollabs: record.get('exampleCollabs')
      }));
    } catch (error) {
      logger.error(`getSuggestedCollaborators Error: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  async search(userId, queryText, filters = {}) {
    const esClient = getEsClient();
    const queryVector = queryText ? await this.vectorizeQuery(queryText) : null;

    // Build ES Query
    const searchBody = {
      size: 50,
      query: {
        bool: {
          must: queryText ? [
            {
              multi_match: {
                query: queryText,
                fields: ['name^2', 'title^2', 'content', 'tags']
              }
            }
          ] : [{ match_all: {} }],
          filter: []
        }
      }
    };

    // Apply Filters
    if (filters.domain) searchBody.query.bool.filter.push({ term: { domain: filters.domain } });
    if (filters.institution) searchBody.query.bool.filter.push({ term: { institution: filters.institution } });
    if (filters.skills) searchBody.query.bool.filter.push({ terms: { tags: filters.skills } });

    // Add kNN if vector exists
    if (queryVector) {
      searchBody.knn = {
        field: "embedding",
        query_vector: queryVector,
        k: 100,
        num_candidates: 1000,
        filter: searchBody.query.bool.filter // Pre-filter kNN too
      };
      // Enable RRF for hybrid ranking
      searchBody.rank = { rrf: {} };
    }

    try {
      const response = await esClient.search({
        index: 'users,papers,projects',
        body: searchBody
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        _index: hit._index,
        _score: hit._score,
        ...hit._source,
        match_type: queryVector ? 'hybrid' : 'keyword'
      }));
    } catch (err) {
      logger.error('Hybrid search query failed', err);
      throw err;
    }
  }

  async savePaper(userId, paperData) {
    const { title, doi, journal } = paperData;
    
    await db.query(
      'INSERT INTO saved_papers (user_id, paper_title, paper_doi, journal_name) VALUES ($1, $2, $3, $4)',
      [userId, title, doi, journal]
    );

    // Rule #17: Emit events
    eventBus.emitEvent('event.behaviour', { type: 'library.paper.saved', userId, doi, timestamp: new Date().toISOString() });
    
    logger.info({ userId, doi }, 'Paper saved to library');

    return { message: 'Paper saved' };
  }
}

module.exports = new DiscoveryService();
