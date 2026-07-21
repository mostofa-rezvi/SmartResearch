const discoveryService = require('./discovery.service');
const logger = require('../utils/logger');

/**
 * Legacy recommendation service (mounted at /api/v1/recommendations).
 *
 * Historically this called the ML service directly and hydrated results with a
 * broken `user_`/`post_`-prefixed ID contract against the `users` table (G3), and
 * without `profile_text` so only collaborative filtering ran (G10).
 *
 * It now delegates to the single source of truth — DiscoveryService.getRecommendationsFromOnboarding —
 * which builds the profile text from onboarding answers (CF + CBF), calls the ML
 * service, and hydrates against the real `researcher_profiles` contract. This keeps
 * the legacy route working while removing the duplicate, buggy hydration path.
 */
class RecommendationService {
    /**
     * Get hybrid, ML-backed researcher recommendations for a user.
     * @param {number} userId
     * @returns {Promise<Array>} hydrated researcher recommendations
     */
    async getRecommendations(userId) {
        try {
            return await discoveryService.getRecommendationsFromOnboarding(userId);
        } catch (error) {
            logger.error(`RecommendationService Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new RecommendationService();
