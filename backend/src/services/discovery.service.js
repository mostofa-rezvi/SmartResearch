const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');

const { getEsClient } = require('../config/elasticsearch');

class DiscoveryService {
  async search(userId, query) {
    // 1. Fetch user interest profile
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [userId]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    // 2. Execute BM25 Keyword Search across indices
    const esClient = getEsClient();
    
    let esResults = [];
    try {
      const response = await esClient.search({
        index: 'users,papers,projects',
        body: {
          query: query ? {
            multi_match: {
              query,
              fields: ['title^2', 'name^2', 'content', 'tags']
            }
          } : {
            match_all: {}
          },
          size: 50
        }
      });
      
      // Extract hits and normalize to our standard format
      esResults = response.hits.hits.map(hit => ({
        id: hit._id,
        _index: hit._index,
        _score: hit._score,
        ...hit._source,
        tags: hit._source.tags || [],
        tier: hit._source.tier || 'Standard'
      }));
    } catch (err) {
      logger.error('Elasticsearch query failed', err);
      // Fallback or empty if ES is unreachable
      esResults = [];
    }

    // 3. Personalization Logic with Explainability
    let results = esResults.map(item => {
      const matchEntries = item.tags.filter(tag => interests.includes(tag));
      const matchCount = matchEntries.length;
      // Add BM25 score to our personalization score
      const score = (item._score || 0) + (matchCount * 10) + (item.tier === 'Q1' ? 5 : 0);
      const matchedInterest = matchCount > 0 ? matchEntries[0] : null;

      return { 
        ...item, 
        score, 
        matchedInterest,
        discovery_reason: matchedInterest 
          ? `Matches your research interest in "${matchedInterest}"` 
          : item.tier === 'Q1' 
            ? 'Highly cited paper in a top-tier journal' 
            : 'Relevant to your search query'
      };
    });

    results.sort((a, b) => b.score - a.score);
    return results;
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
