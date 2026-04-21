const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

/**
 * Initializes the Redis client for caching and rate limiting.
 */
const initRedis = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
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
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

module.exports = {
  initRedis,
  getRedisClient
};
