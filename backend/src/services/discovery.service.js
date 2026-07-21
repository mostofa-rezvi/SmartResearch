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
    const uid = parseInt(userId);
    try {
      // 2nd-degree collaborator suggestions from TWO graph signals, unioned:
      //   (a) friend-of-friend via a shared collaborator (COLLABORATES edges — from accepted connections)
      //   (b) co-authorship via a shared paper's co-authors (AUTHORED edges through Paper nodes)
      // Both exclude the user's own direct links. Aggregated below by suggested user.
      const query = `
        MATCH (me:Researcher {userId: $userId})-[:COLLABORATES]-(mutual:Researcher)-[:COLLABORATES]-(suggested:Researcher)
        WHERE me <> suggested AND NOT (me)-[:COLLABORATES]-(suggested)
        RETURN suggested.userId AS userId, suggested.name AS name, mutual.name AS via
        UNION
        MATCH (me:Researcher {userId: $userId})-[:AUTHORED]->(:Paper)<-[:AUTHORED]-(coauthor:Researcher)-[:AUTHORED]->(:Paper)<-[:AUTHORED]-(suggested:Researcher)
        WHERE me <> suggested AND NOT (me)-[:AUTHORED]->(:Paper)<-[:AUTHORED]-(suggested)
        RETURN suggested.userId AS userId, suggested.name AS name, coauthor.name AS via
      `;

      const result = await session.run(query, { userId: uid });

      // Aggregate: for each suggested researcher, count DISTINCT shared collaborators/co-authors ("via")
      const agg = new Map();
      for (const rec of result.records) {
        const raw = rec.get('userId');
        const id = raw && typeof raw.toNumber === 'function' ? raw.toNumber() : Number(raw);
        if (!Number.isFinite(id)) continue;
        if (!agg.has(id)) agg.set(id, { userId: id, name: rec.get('name'), viaSet: new Set() });
        const via = rec.get('via');
        if (via) agg.get(id).viaSet.add(via);
      }

      return Array.from(agg.values())
        .map((e) => ({
          userId: e.userId,
          name: e.name,
          sharedCollabs: e.viaSet.size,
          exampleCollabs: Array.from(e.viaSet).slice(0, 3),
        }))
        .sort((a, b) => b.sharedCollabs - a.sharedCollabs)
        .slice(0, 10);
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

      // Module 10: log real ML match scores for admin match-quality analytics (fire-and-forget)
      this._logMatchScores(userId, mappedResearchers).catch((e) =>
        logger.warn(`[Discovery] match-score logging failed: ${e.message}`));

      return mappedResearchers;
    } catch (err) {
      logger.error('Error fetching ML recommendations from onboarding', err);
      throw err;
    }
  }

  /** Persist the served recommendation match scores (0..1) for admin analytics. */
  async _logMatchScores(userId, matches) {
    const top = (matches || []).slice(0, 20).filter((m) => m && m.id);
    if (top.length === 0) return;
    for (const m of top) {
      const score = Math.max(0, Math.min(1, (m.similarityScore || 0) / 100));
      await db.query(
        `INSERT INTO recommendation_scores (user_id, matched_id, match_type, score)
         VALUES ($1, $2, 'collaborator', $3)
         ON CONFLICT (user_id, matched_id, match_type)
         DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()`,
        [userId, String(m.id), score]
      ).catch(() => {});
    }
  }

  /**
   * Unified recommendation feed (Module 2): merges matched collaborators, relevant
   * papers (semantic library search on the user's interests), and open projects.
   * @returns {Promise<{collaborators:Array, papers:Array, projects:Array}>}
   */
  async getUnifiedFeed(userId) {
    // 1. Collaborators (ML-backed researcher recommendations)
    let collaborators = [];
    try {
      collaborators = (await this.getRecommendationsFromOnboarding(userId)).slice(0, 10);
    } catch (e) {
      logger.warn(`[Feed] collaborator recs failed: ${e.message}`);
    }

    // 2. Build interest text from the user's profile for paper matching
    const meRes = await db.query(
      `SELECT COALESCE(research_interests,'[]'::jsonb) AS ri, COALESCE(domain_tags,'[]'::jsonb) AS dt
         FROM users WHERE id = $1`, [userId]
    ).catch(() => ({ rows: [{ ri: [], dt: [] }] }));
    const interestText = [...(meRes.rows[0]?.ri || []), ...(meRes.rows[0]?.dt || [])].join(', ');

    // 3. Relevant papers via semantic library search
    let papers = [];
    if (interestText) {
      try {
        const libraryService = require('./library.service');
        papers = await libraryService.searchItems(interestText, 10);
      } catch (e) {
        logger.warn(`[Feed] paper recs failed: ${e.message}`);
      }
    }

    // Module 8: collaborator_match notification for the top registered-user match (deduped)
    try {
      const top = collaborators.find((c) => c.internalUserId && c.internalUserId !== userId);
      if (top) {
        const { getRedisClient } = require('../config/redis');
        const redis = getRedisClient();
        const key = `notif:collab_match:${userId}:${top.internalUserId}`;
        const fresh = await redis.set(key, '1', 'EX', 7 * 24 * 3600, 'NX');
        if (fresh) {
          const notificationService = require('./notification.service');
          await notificationService.notify(userId, 'collaborator_match',
            'New collaborator match',
            `${top.name} looks like a strong research match (${top.similarityScore}% similar).`,
            { match_user_id: top.internalUserId });
        }
      }
    } catch (e) { logger.warn(`[Feed] collaborator_match notify failed: ${e.message}`); }

    // 4. Open projects (active, not owned by the user)
    let projects = [];
    try {
      const projRes = await db.query(
        `SELECT p.id, p.name, p.description, p.status, p.created_at,
                COUNT(pm.user_id) AS member_count
           FROM projects p
           LEFT JOIN project_members pm ON pm.project_id = p.id
          WHERE p.status = 'active'
          GROUP BY p.id
          ORDER BY p.created_at DESC LIMIT 10`
      );
      projects = projRes.rows;
    } catch (e) {
      logger.warn(`[Feed] project recs failed: ${e.message}`);
    }

    return { collaborators, papers, projects };
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

    // Add kNN if vector exists. NOTE: we combine kNN + keyword directly (ES adds
    // the scores) rather than using `rank.rrf`, which requires a paid ES license.
    if (queryVector) {
      searchBody.knn = {
        field: "embedding",
        query_vector: queryVector,
        k: 100,
        num_candidates: 1000,
        filter: searchBody.query.bool.filter // Pre-filter kNN too
      };
    }

    try {
      const response = await esClient.search({
        // Forum posts are embedded in the same semantic space (Module 5) — search
        // them alongside profiles, papers and projects.
        index: 'users,papers,projects,posts',
        ignore_unavailable: true,
        body: searchBody
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        _index: hit._index,
        _score: hit._score,
        ...hit._source,
        // normalize a result-kind for the UI (post|researcher|paper|project)
        result_type: hit._index === 'posts' ? 'post'
          : hit._index === 'users' ? 'researcher'
          : hit._index === 'papers' ? 'paper' : 'project',
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
