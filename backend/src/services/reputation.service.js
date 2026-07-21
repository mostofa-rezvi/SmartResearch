const db = require('../config/db');
const eventBus = require('./eventBus.service');
const socketService = require('./socket.service');


/**
 * Fat Service representing Domain Logic for Scholar Reputation and Citation Impact.
 */
class ReputationService {
  /**
   * Award (or deduct) reputation points to any user, recording a ledger entry.
   * Works for all users (not just invited profiles). Used by mentorship,
   * accepted answers, endorsements, etc.
   * @param {number} userId
   * @param {number} points  positive to award, negative to deduct
   * @param {string} reason  e.g. 'accepted_answer', 'mentorship_accepted'
   * @param {string} [refType]
   * @param {string|number} [refId]
   */
  async award(userId, points, reason, refType = null, refId = null) {
    if (!userId) throw new Error('User ID is required');
    await db.query(
      `INSERT INTO reputation_events (user_id, points, reason, ref_type, ref_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, points, reason, refType, refId != null ? String(refId) : null]
    );
    const res = await db.query(
      `UPDATE users SET reputation_points = COALESCE(reputation_points, 0) + $1
        WHERE id = $2 RETURNING reputation_points`,
      [points, userId]
    );
    const total = res.rows[0]?.reputation_points ?? null;

    eventBus.emitEvent('event.behaviour', {
      type: 'reputation_awarded', userId, points, reason, refType, refId,
      timestamp: new Date().toISOString(),
    });
    try {
      socketService.emitToUser(userId, 'reputation_update', { delta: points, reason, total });
    } catch (_) { /* socket optional */ }

    return { userId, points, total, reason };
  }

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

    // Emit event to Redis Streams for downstream ML and discovery processing
    eventBus.emitEvent('event.behaviour', {
      type: 'scholar_impact_calculated',
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

  /**
   * Updates reputation based on community interactions (upvotes, answers).
   * @param {string} userId - Target user ID
   * @param {number} delta - The amount of reputation to add/remove
   */
  async updateCommunityReputation(userId, delta) {
    if (!userId) throw new Error("User ID is required");

    // Increment impact score in the database
    // Note: We use a COALESCE to handle cases where impact_score might be null
    await db.query(
      `UPDATE invited_user_profiles SET impact_score = COALESCE(impact_score, 0) + $1 WHERE user_id = $2`,
      [delta, userId]
    );

    // Emit event for real-time UI updates and ML re-ranking
    eventBus.emitEvent('event.behaviour', {
      type: 'community_reputation_updated',
      userId,
      delta,
      timestamp: new Date().toISOString()
    });

    // Notify user via WebSocket for live UI feedback
    socketService.emitToUser(userId, 'reputation_update', {
      delta,
      timestamp: new Date().toISOString()
    });

    return { success: true, userId, delta };

  }
}


module.exports = new ReputationService();
