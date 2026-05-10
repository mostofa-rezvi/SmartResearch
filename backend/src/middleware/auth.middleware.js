const jwt = require('jsonwebtoken');
const config = require('../config/index');

const db = require('../config/db');

/**
 * Middleware to verify JWT access token from Authorization header.
 */
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const userId = decoded.id || (decoded.user && decoded.user.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    const result = await db.query(
      'SELECT id, name, email, role, onboarding_completed FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error(`[Auth] Token verification failed: ${err.message}`, { token: token.substring(0, 10) + '...' });
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = {
  verifyAuth,
};
