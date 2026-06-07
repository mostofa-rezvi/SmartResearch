const { createClient } = require('../config/redis');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

const STREAM_KEY = 'notification.events';
const GROUP_NAME = 'notification_group';
const CONSUMER_NAME = `notification_worker_${process.pid}`;

class NotificationWorker {
  constructor() {
    this.redisClient = null;
    this.isRunning = false;
  }

  async init() {
    this.redisClient = createClient();

    try {
      // Create consumer group, $ means start consuming from new messages only
      await this.redisClient.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');
      logger.info(`[NotificationWorker] Consumer group ${GROUP_NAME} created on stream ${STREAM_KEY}.`);
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        logger.info(`[NotificationWorker] Consumer group ${GROUP_NAME} already exists.`);
      } else {
        logger.error(`[NotificationWorker] Failed to create consumer group: ${err.message}`);
      }
    }
  }

  async start() {
    this.isRunning = true;
    logger.info(`[NotificationWorker] Worker started with consumer name ${CONSUMER_NAME}...`);
    
    // Process any previously pending messages before listening for new ones
    await this.processPendingMessages();

    // Simple loop for consuming messages
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
        logger.error(`[NotificationWorker] Error in read loop: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processPendingMessages() {
    logger.info('[NotificationWorker] Checking for pending messages (PEL)...');
    try {
      while (this.isRunning) {
        const results = await this.redisClient.xreadgroup(
          'GROUP', GROUP_NAME, CONSUMER_NAME,
          'COUNT', 10,
          'STREAMS', STREAM_KEY, '0'
        );

        if (!results || results[0][1].length === 0) {
          logger.info('[NotificationWorker] No more pending messages.');
          break;
        }

        const messages = results[0][1];
        logger.info(`[NotificationWorker] Processing ${messages.length} pending messages...`);

        for (const message of messages) {
          await this.processMessage(message);
        }
      }
    } catch (err) {
      logger.error(`[NotificationWorker] Error processing PEL: ${err.message}`);
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

      logger.info(`[NotificationWorker] Processing message ${messageId} for user ${payload.userId}`);

      await notificationService.processNotify(payload);

      // Acknowledge the message so it is removed from the PEL
      await this.redisClient.xack(STREAM_KEY, GROUP_NAME, messageId);
      logger.info(`[NotificationWorker] Message ${messageId} acknowledged.`);
      
    } catch (err) {
      logger.error(`[NotificationWorker] Failed to process message ${messageId}:`, err);
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('[NotificationWorker] Worker stopped.');
  }
}

module.exports = new NotificationWorker();
