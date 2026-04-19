const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Generic limiter for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip, url: req.originalUrl }, 'Rate limit exceeded');
    res.status(options.statusCode).json({
      success: false,
      error: 'Too many requests, please try again later.',
      meta: { retryAfter: Math.ceil(options.windowMs / 1000) }
    });
  }
});

// Stricter limiter for Auth routes (Rule #8 Security)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit each IP to 10 attempts per hour
  message: 'Too many authentication attempts, please try again in an hour',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter };
