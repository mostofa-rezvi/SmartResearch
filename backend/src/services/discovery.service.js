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

  async getRecommendationsFromOnboarding(userId) {
    try {
      // 1. Fetch user onboarding answers
      const answersResult = await db.query(
        `SELECT q.question_text, a.answer_data 
         FROM onboarding_answers a
         JOIN onboarding_questions q ON a.question_id = q.id
         WHERE a.user_id = $1 AND q.section IN ('focus', 'identity', 'publication')`,
        [userId]
      );
      
      let userInterests = [];
      answersResult.rows.forEach(r => {
        let ans = [];
        try { ans = JSON.parse(r.answer_data); } catch (e) { ans = [r.answer_data]; }
        if (Array.isArray(ans)) {
          userInterests = userInterests.concat(ans);
        } else if (typeof ans === 'string') {
          userInterests.push(ans);
        }
      });
      
      const profile_text = userInterests.join(', ');

      // 2. Call ML Service
      let mlResults = [];
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommendations/${userId}`, {
          profile_text: profile_text
        });
        if (mlResponse.data && mlResponse.data.recommendations) {
          mlResults = mlResponse.data.recommendations; // format: [[id, score], ...]
        }
      } catch (mlErr) {
        logger.error('Failed to call ML service for recommendations', mlErr.message);
      }

      // 3. Fallback: If ML service is down or returned empty, fetch popular researchers directly
      if (!mlResults || mlResults.length === 0) {
        logger.info('Using popular researchers fallback in Node layer.');
        const popular = await db.query(
          `SELECT id, cited_by_count FROM researcher_profiles ORDER BY cited_by_count DESC NULLS LAST`
        );
        mlResults = popular.rows.map(r => [r.id, Math.min(0.99, (r.cited_by_count || 0) / 1000000.0)]);
      }

      if (!mlResults.length) return [];

      // 3. Fetch researcher profiles for the recommended IDs, LEFT JOIN users to resolve internalUserId
      const recommendedIds = mlResults.map(r => r[0]); // Extracted IDs
      
      // Strategy: match platform user via (a) direct openalex_id link, or
      // (b) name+institution fuzzy match where exactly one platform user matches.
      const researchers = await db.query(
        `SELECT
           rp.id,
           rp.name,
           rp.role,
           rp.institution,
           rp.country,
           rp.works_count,
           rp.cited_by_count,
           rp.h_index,
           rp.research_interests,
           rp.user_id,
           -- Fallback: resolve platform user by openalex_id direct match
           COALESCE(
             rp.user_id,
             (SELECT u.id FROM users u WHERE u.openalex_id = rp.id LIMIT 1),
             -- Fuzzy name+institution match — only if unambiguous (exactly one result)
             CASE WHEN (
               SELECT COUNT(*) FROM users u
               WHERE LOWER(TRIM(u.name)) = LOWER(TRIM(rp.name))
                 AND ($2::integer IS NULL OR u.id != $2)
             ) = 1 THEN (
               SELECT u.id FROM users u
               WHERE LOWER(TRIM(u.name)) = LOWER(TRIM(rp.name))
               LIMIT 1
             ) ELSE NULL END
           ) AS resolved_user_id
         FROM researcher_profiles rp
         WHERE rp.id = ANY($1::varchar[])`,
        [recommendedIds, userId]
      );

      // 4. Map scores to researchers and sort
      const mappedResearchers = researchers.rows.map(researcher => {
        // Find the matching ML result to get the score
        const match = mlResults.find(r => r[0] === researcher.id);
        const score = match ? match[1] : 0;
        
        // Normalize score 0-100 for frontend display
        let similarityScore = Math.min(99, Math.round(70 + (score * 500)));

        return {
          id: researcher.id,
          name: researcher.name,
          institution: researcher.institution,
          role: researcher.role,
          country: researcher.country,
          works_count: researcher.works_count,
          cited_by_count: researcher.cited_by_count,
          h_index: researcher.h_index,
          research_interests: researcher.research_interests,
          similarityScore,
          // Platform user ID — null if this OpenAlex researcher hasn't registered yet
          internalUserId: researcher.resolved_user_id || null,
        };
      });

      // Sort by similarity score descending
      mappedResearchers.sort((a, b) => b.similarityScore - a.similarityScore);

      return mappedResearchers;
    } catch (err) {
      logger.error('Error fetching ML recommendations from onboarding', err);
      throw err;
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
    
    // Notify ML service immediately for real-time recommendation updates
    try {
      axios.post(`${ML_SERVICE_URL}/interactions`, {
        user_id: userId,
        item_id: doi,
        action: 'bookmark'
      }).catch(err => logger.warn(`[ML] savePaper interaction signal failed: ${err.message}`));
    } catch (err) {
      logger.warn(`[ML] savePaper interaction sync failed: ${err.message}`);
    }

    logger.info({ userId, doi }, 'Paper saved to library');

    return { message: 'Paper saved' };
  }
}

module.exports = new DiscoveryService();
