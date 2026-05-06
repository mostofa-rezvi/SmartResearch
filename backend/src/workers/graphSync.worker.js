const { createClient } = require('../config/redis');
const { getSession } = require('../config/neo4j');
const logger = require('../utils/logger');

const STREAM_KEY = 'profile.created';
const GROUP_NAME = 'graph_sync_group';
const CONSUMER_NAME = `worker_${process.pid}`;

class GraphSyncWorker {
  constructor() {
    this.redisClient = null;
    this.isRunning = false;
  }

  async init() {
    this.redisClient = createClient();

    try {
      // Create consumer group, $ means start consuming from new messages only
      await this.redisClient.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');
      logger.info(`[GraphSync] Consumer group ${GROUP_NAME} created on stream ${STREAM_KEY}.`);
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        logger.info(`[GraphSync] Consumer group ${GROUP_NAME} already exists.`);
      } else {
        logger.error(`[GraphSync] Failed to create consumer group: ${err.message}`);
      }
    }
  }

  async start() {
    this.isRunning = true;
    logger.info(`[GraphSync] Worker started with consumer name ${CONSUMER_NAME}...`);
    
    // Process any previously pending messages before listening for new ones
    await this.processPendingMessages();

    // Simple loop for consuming messages
    while (this.isRunning) {
      try {
        // XREADGROUP GROUP group consumer BLOCK 5000 COUNT 10 STREAMS stream >
        const results = await this.redisClient.xreadgroup(
          'GROUP', GROUP_NAME, CONSUMER_NAME,
          'BLOCK', 5000,
          'COUNT', 10,
          'STREAMS', STREAM_KEY, '>'
        );

        if (results) {
          const stream = results[0]; // [streamName, messages]
          const messages = stream[1]; // [[id, fields], ...]

          for (const message of messages) {
            await this.processMessage(message);
          }
        }
      } catch (err) {
        logger.error(`[GraphSync] Error in read loop: ${err.message}`);
        // Backoff slightly to prevent tight loop on persistent errors
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processPendingMessages() {
    logger.info('[GraphSync] Checking for pending messages (PEL)...');
    try {
      while (this.isRunning) {
        const results = await this.redisClient.xreadgroup(
          'GROUP', GROUP_NAME, CONSUMER_NAME,
          'COUNT', 10,
          'STREAMS', STREAM_KEY, '0'
        );

        if (!results || results[0][1].length === 0) {
          logger.info('[GraphSync] No more pending messages.');
          break;
        }

        const messages = results[0][1];
        logger.info(`[GraphSync] Processing ${messages.length} pending messages...`);

        for (const message of messages) {
          await this.processMessage(message);
        }
      }
    } catch (err) {
      logger.error(`[GraphSync] Error processing PEL: ${err.message}`);
    }
  }

  async processMessage(message) {
    const [messageId, fields] = message;
    
    try {
      // fields is an array like ['payload', '{...}']
      const payloadIndex = fields.indexOf('payload');
      if (payloadIndex === -1) {
        throw new Error('Message missing payload field');
      }

      const payloadStr = fields[payloadIndex + 1];
      const payload = JSON.parse(payloadStr);

      logger.info(`[GraphSync] Processing message ${messageId} for user ${payload.id}`);

      // Map to Neo4j Researcher Node
      const session = getSession();
      try {
        await session.run(`
          MERGE (r:Researcher {userId: $id})
          SET r.name = $name,
              r.email = $email
          WITH r
          WHERE $institutionName IS NOT NULL
          MERGE (i:Institution {name: $institutionName})
          MERGE (r)-[:AFFILIATED_WITH]->(i)
          SET r.isVerifiedInstitutional = true
          RETURN r
        `, {
          id: parseInt(payload.id),
          name: payload.name || 'Unknown',
          email: payload.email || '',
          institutionName: payload.institution_name || null
        });
        
        logger.info(`[GraphSync] Researcher node created/updated for user ${payload.id}`);
      } finally {
        await session.close();
      }

      // Acknowledge the message so it is removed from the PEL (Pending Entries List)
      await this.redisClient.xack(STREAM_KEY, GROUP_NAME, messageId);
      logger.info(`[GraphSync] Message ${messageId} acknowledged.`);
      
    } catch (err) {
      logger.error(`[GraphSync] Failed to process message ${messageId}:`, err);
      // In production, we'd have DLQ logic here. For now, it stays unacknowledged.
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('[GraphSync] Worker stopped.');
  }
}

module.exports = new GraphSyncWorker();
