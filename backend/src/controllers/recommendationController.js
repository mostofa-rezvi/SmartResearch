const recommendationService = require('../services/recommendationService');
const logger = require('../utils/logger');

const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const recommendations = await recommendationService.getRecommendations(userId);
        res.status(200).json({
            status: 'success',
            data: recommendations
        });
    } catch (error) {
        logger.error(`getRecommendations Controller Error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch recommendations'
        });
    }
};

module.exports = {
    getRecommendations
};
