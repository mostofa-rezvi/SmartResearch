const { getRedisClient } = require('../config/redis');
const { getEsClient } = require('../config/elasticsearch');
const logger = require('../utils/logger');

const STREAM_KEY = 'profile.created';
const GROUP_NAME = 'search_sync_group';
const CONSUMER_NAME = `search_worker_${process.pid}`;

class SearchSyncWorker {
  constructor() {
    this.redisClient = null;
    this.isRunning = false;
  }

  async init() {
    this.redisClient = getRedisClient();

    try {
      // Create consumer group
      await this.redisClient.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');
      logger.info(`[SearchSync] Consumer group ${GROUP_NAME} created on stream ${STREAM_KEY}.`);
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        logger.info(`[SearchSync] Consumer group ${GROUP_NAME} already exists.`);
      } else {
        logger.error(`[SearchSync] Failed to create consumer group: ${err.message}`);
      }
    }
  }

  async start() {
    this.isRunning = true;
    logger.info(`[SearchSync] Worker started with consumer name ${CONSUMER_NAME}...`);
    
    // Process any previously pending messages before listening for new ones
    await this.processPendingMessages();

    while (this.isRunning) {
      try {
        const results = await this.redisClient.xreadgroup(
          'GROUP', GROUP_NAME, CONSUMER_NAME,
          'BLOCK', 5000,
          'COUNT', 10,
          'STREAMS', STREAM_KEY, '>'
        );

        if (results) {
          const stream = results[0];
          const messages = stream[1];

          for (const message of messages) {
            await this.processMessage(message);
          }
        }
      } catch (err) {
        logger.error(`[SearchSync] Error in read loop: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processPendingMessages() {
    logger.info('[SearchSync] Checking for pending messages (PEL)...');
    try {
      while (this.isRunning) {
        const results = await this.redisClient.xreadgroup(
          'GROUP', GROUP_NAME, CONSUMER_NAME,
          'COUNT', 10,
          'STREAMS', STREAM_KEY, '0'
        );

        if (!results || results[0][1].length === 0) {
          logger.info('[SearchSync] No more pending messages.');
          break;
        }

        const messages = results[0][1];
        logger.info(`[SearchSync] Processing ${messages.length} pending messages...`);

        for (const message of messages) {
          await this.processMessage(message);
        }
      }
    } catch (err) {
      logger.error(`[SearchSync] Error processing PEL: ${err.message}`);
    }
  }

  async processMessage(message) {
    const [messageId, fields] = message;
    
    try {
      const payloadIndex = fields.indexOf('payload');
      if (payloadIndex === -1) {
        throw new Error('Message missing payload field');
      }

      const payloadStr = fields[payloadIndex + 1];
      const payload = JSON.parse(payloadStr);

      logger.info(`[SearchSync] Processing message ${messageId} for user ${payload.id}`);

      const esClient = getEsClient();
      await esClient.index({
        index: 'users',
        id: payload.id.toString(),
        document: {
          name: payload.name || 'Unknown',
          email: payload.email || '',
          content: payload.bio || '', // Example mapping
        }
      });
      
      logger.info(`[SearchSync] Elasticsearch document created/updated for user ${payload.id}`);

      // Acknowledge the message
      await this.redisClient.xack(STREAM_KEY, GROUP_NAME, messageId);
      logger.info(`[SearchSync] Message ${messageId} acknowledged.`);
      
    } catch (err) {
      logger.error(`[SearchSync] Failed to process message ${messageId}:`, err);
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('[SearchSync] Worker stopped.');
  }
}

module.exports = new SearchSyncWorker();
