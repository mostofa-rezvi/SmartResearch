const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const config = require('../config/index');

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generate Access Token
 * @param {string} userId 
 * @returns {string}
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
};

/**
 * Generate Refresh Token
 * @param {string} userId 
 * @returns {string}
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
};

/**
 * Store the refresh token in Redis
 * @param {string} token 
 * @param {string} userId 
 */
const storeRefreshToken = async (token, userId) => {
  const redis = getRedisClient();
  await redis.set(`refresh_token:${token}`, userId, 'EX', REFRESH_TOKEN_TTL_SECONDS);
};

/**
 * Verify if the refresh token exists in Redis
 * @param {string} token 
 * @returns {Promise<string|null>} The user ID if valid, null otherwise
 */
const getUserIdFromRefreshToken = async (token) => {
  const redis = getRedisClient();
  return redis.get(`refresh_token:${token}`);
};

/**
 * Delete refresh token from Redis.
 * Supports a short grace period (15s) during rotation to prevent race conditions
 * with concurrent in-flight requests.
 * @param {string} token 
 * @param {boolean} [immediate=false]
 */
const deleteRefreshToken = async (token, immediate = false) => {
  const redis = getRedisClient();
  if (immediate) {
    await redis.del(`refresh_token:${token}`);
  } else {
    // Grace period of 15 seconds for in-flight requests right during rotation
    await redis.expire(`refresh_token:${token}`, 15);
  }
};

/**
 * Verify a JWT token
 * @param {string} token 
 * @param {string} secret 
 * @returns {object} Decoded payload
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  getUserIdFromRefreshToken,
  deleteRefreshToken,
  verifyToken,
};
