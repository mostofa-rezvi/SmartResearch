const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class EventBusService {
  /**
   * Emit an event to a Redis Stream
   * @param {string} topic - The stream key (e.g., 'profile.created')
   * @param {Object} payload - The event data
   */
  async emitEvent(topic, payload) {
    try {
      const redisClient = getRedisClient();
      
      // XADD stream_key * field1 value1 ...
      // We store the entire payload as a JSON string under the 'payload' field
      const messageId = await redisClient.xadd(
        topic,
        '*',
        'payload',
        JSON.stringify(payload)
      );
      
      logger.info(`[EVENT BUS] Emitted event to ${topic} | ID: ${messageId}`);
      return messageId;
    } catch (err) {
      logger.error(`[EVENT BUS] Failed to emit event to ${topic}:`, err);
      // Depending on strictness, we might want to throw or just log.
      // For now, we log to prevent blocking the main request cycle.
    }
  }
}

module.exports = new EventBusService();
