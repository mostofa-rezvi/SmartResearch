const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Creates a rate limiter backed by Redis.
 * @param {number} windowMs 
 * @param {number} limit 
 * @param {string} prefix 
 * @returns 
 */
const createLimiter = (windowMs, limit, prefix) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => getRedisClient().call(...args),
      prefix,
    }),
    handler: (req, res, next, options) => {
      logger.warn({ ip: req.ip, url: req.originalUrl }, 'Rate limit exceeded');
      res.status(options.statusCode).json({
        success: false,
        error: 'Too many requests, please try again later.',
        meta: { retryAfter: Math.ceil(options.windowMs / 1000) }
      });
    }
  });
};

// Global limiter: 1000 requests per 15 minutes (Increased for batch syncing)
const apiLimiter = createLimiter(15 * 60 * 1000, 1000, 'rl:global:');

// Auth limiter: 10 requests per 1 hour (for login, register, etc.)
const authLimiter = createLimiter(60 * 60 * 1000, 100, 'rl:auth:');

module.exports = {
  apiLimiter,
  authLimiter,
};
