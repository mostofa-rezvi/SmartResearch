/**
 * Global Error Handler Middleware — Required by standards.md §1
 * Centralized error handling: no unhandled promise rejections.
 */

const { errorEnvelope } = require('../utils/responseEnvelope');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || (err.isJoi ? 400 : 500);
  const message = err.message || 'Internal Server Error';

  logger.error({
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    details: err.details, // Joi details
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    user: req.user ? req.user.id : 'anonymous'
  }, 'Request Error');

  res.status(statusCode).json(errorEnvelope(message, statusCode, err.details));
};

module.exports = errorHandler;
