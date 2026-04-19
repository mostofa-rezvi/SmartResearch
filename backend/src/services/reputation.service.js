const db = require('../config/db');
const { emitEvent } = require('../utils/kafkaEmitter');

/**
 * Fat Service representing Domain Logic for Scholar Reputation and Citation Impact.
 */
class ReputationService {
  /**
   * Calculates the citation impact and updates the user's reputation score.
   * Emits a Kafka event to the Machine Learning pipeline to update global discovery weights.
   */
  async calculateCitationImpact(userId, standardCitations, highImpactCitations) {
    if (!userId) throw new Error("User ID is required");

    // Proprietary impact calculation formula
    const baseScore = standardCitations * 1.5;
    const premiumScore = highImpactCitations * 5.0;
    const totalImpact = Math.round(baseScore + premiumScore);

    // Persist in mock transactional flow (updating user's profile)
    await db.query(
      `UPDATE invited_user_profiles SET impact_score = $1 WHERE user_id = $2`,
      [totalImpact, userId]
    );

    // Emit event to Kafka for downstream ML and discovery processing
    emitEvent('scholar_impact_calculated', `user_${userId}`, {
      userId,
      standardCitations,
      highImpactCitations,
      newImpactScore: totalImpact,
      timestamp: new Date().toISOString()
    });

    return {
      userId,
      impactScore: totalImpact,
      delta: premiumScore // example logic
    };
  }
}

module.exports = new ReputationService();
