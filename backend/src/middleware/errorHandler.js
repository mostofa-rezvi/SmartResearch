/**
 * Global Error Handler Middleware — Required by standards.md §1
 * Centralized error handling: no unhandled promise rejections.
 */

const { errorEnvelope } = require('../utils/responseEnvelope');

const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(errorEnvelope(message, statusCode));
};

module.exports = errorHandler;
