const axios = require('axios');
const { Pool } = require('pg');
const pool = new Pool();
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class RecommendationService {
    /**
     * Get hybrid recommendations for a user and hydrate them with metadata.
     */
    async getRecommendations(userId) {
        try {
            // 1. Call ML Service
            const response = await axios.post(`${ML_SERVICE_URL}/recommendations/${userId}`);
            const recs = response.data.recommendations; // List of [id, rrf_score]

            if (!recs || recs.length === 0) {
                return [];
            }

            // 2. Hydrate IDs
            // Separate researcher IDs (user_X) from Paper IDs (DOIs/titles)
            const researcherIds = recs
                .filter(r => r[0].startsWith('user_'))
                .map(r => parseInt(r[0].replace('user_', '')));
            
            const paperIds = recs
                .filter(r => !r[0].startsWith('user_') && !r[0].startsWith('post_'))
                .map(r => r[0]);

            const hydratedResults = [];

            // Fetch Researcher Metadata
            if (researcherIds.length > 0) {
                const res = await pool.query(
                    'SELECT id, name, institution, bio, avatar_url FROM users WHERE id = ANY($1)',
                    [researcherIds]
                );
                res.rows.forEach(user => {
                    const recData = recs.find(r => r[0] === `user_${user.id}`);
                    hydratedResults.push({
                        type: 'researcher',
                        id: user.id,
                        name: user.name,
                        institution: user.institution,
                        bio: user.bio,
                        avatarUrl: user.avatar_url,
                        score: recData ? recData[1] : 0
                    });
                });
            }

            // Fetch Paper Metadata (from saved_papers or external catalog - assuming simplified hydration here)
            if (paperIds.length > 0) {
                // In a real scenario, we'd query the 'papers' table or ES
                paperIds.forEach(id => {
                    const recData = recs.find(r => r[0] === id);
                    hydratedResults.push({
                        type: 'paper',
                        id: id,
                        title: id, // Fallback to DOI/Title as ID
                        score: recData ? recData[1] : 0
                    });
                });
            }

            // Sort by score
            return hydratedResults.sort((a, b) => b.score - a.score);

        } catch (error) {
            logger.error(`RecommendationService Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new RecommendationService();
