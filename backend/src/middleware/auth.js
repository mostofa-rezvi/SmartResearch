const jwt = require('jsonwebtoken');
const config = require('../config/index');
const db = require('../config/db');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  let token = req.header('x-auth-token');

  // Also check standard Authorization Bearer header
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    // Token payload is { id: userId } from token.service.js
    const userId = decoded.id || (decoded.user && decoded.user.id);
    if (!userId) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    const result = await db.query(
      'SELECT id, name, email, role, onboarding_completed FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    logger.error('JWT Verification failed: ' + err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authorization denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
};

const requireOnboarding = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authorization denied' });
  }

  // Allow bypass only if onboarding_completed is true
  if (!req.user.onboarding_completed) {
    return res.status(403).json({ message: 'Onboarding completion is mandatory to access this resource' });
  }

  next();
};

module.exports = { auth, requireRole, requireOnboarding };
