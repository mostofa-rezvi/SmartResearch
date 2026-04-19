/**
 * Standard API Response Envelope — Required by standards.md §2
 * Every response must follow: { success, data, meta }
 */

const envelope = (data, meta = {}) => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

const errorEnvelope = (message, statusCode = 500) => ({
  success: false,
  error: { message, statusCode },
  meta: {
    timestamp: new Date().toISOString()
  }
});

module.exports = { envelope, errorEnvelope };
