const Redis = require('ioredis');
const logger = require('../utils/logger');
const config = require('./index');

let redisClient;

/**
 * Initializes the Redis client for caching and rate limiting.
 */
const initRedis = () => {
  const url = config.redis.url;
  
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('connect', () => logger.info('Redis connected successfully'));
    redisClient.on('error', (err) => logger.error('Redis connection error:', err));
  } catch (err) {
    logger.error('Failed to initialize Redis client', err);
  }
};

/**
 * Returns the active Redis client.
 */
const getRedisClient = () => {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
};

/**
 * Returns a fresh Redis client instance.
 * Useful for blocking commands (like BRPOP or XREAD BLOCK) to avoid blocking the main app connection.
 */
const createClient = () => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // Blocking commands require this
  });
};

module.exports = {
  initRedis,
  getRedisClient,
  createClient
};
