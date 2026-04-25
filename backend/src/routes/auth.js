const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('passport');
const { getRedisClient } = require('../config/redis');
const authController = require('../controllers/auth.controller');

// --- OAuth State Management (T4 Fix: CSRF protection) ---
const OAUTH_STATE_TTL = 300; // 5 minutes

const storeOAuthState = async (state) => {
  const redis = getRedisClient();
  await redis.set(`oauth_state:${state}`, '1', 'EX', OAUTH_STATE_TTL);
};

const validateOAuthState = async (state) => {
  const redis = getRedisClient();
  const exists = await redis.get(`oauth_state:${state}`);
  if (exists) {
    await redis.del(`oauth_state:${state}`); // Single-use
    return true;
  }
  return false;
};

// @route   POST /api/v1/auth/register
// @desc    Register a new user with email and password
router.post('/register', authController.register);

// @route   POST /api/v1/auth/login
// @desc    Login with email and password
router.post('/login', authController.login);

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token using refresh token cookie
router.post('/refresh', authController.refresh);

// @route   POST /api/v1/auth/logout
// @desc    Logout user and invalidate refresh token
router.post('/logout', authController.logout);

// @route   GET /api/v1/auth/verify-email
// @desc    Verify user email
router.get('/verify-email', authController.verifyEmail);

// @route   POST /api/v1/auth/exchange-code
// @desc    Exchange OAuth auth code for tokens (T2 security fix)
router.post('/exchange-code', authController.exchangeAuthCode);

// @route   GET /api/v1/auth/google
// @desc    Initiate Google OAuth with state parameter
router.get('/google', async (req, res, next) => {
  const state = crypto.randomBytes(32).toString('hex');
  await storeOAuthState(state);
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
});

// @route   GET /api/v1/auth/google/callback
// @desc    Google OAuth callback with state validation
router.get('/google/callback', async (req, res, next) => {
  const { state } = req.query;
  if (!state || !(await validateOAuthState(state))) {
    return res.status(403).json({ error: 'Invalid OAuth state. Possible CSRF attack.' });
  }
  passport.authenticate('google', { failureRedirect: '/login', session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_denied`);
    req.user = user;
    authController.oauthCallback(req, res, next);
  })(req, res, next);
});

// @route   GET /api/v1/auth/github
// @desc    Initiate GitHub OAuth with state parameter
router.get('/github', async (req, res, next) => {
  const state = crypto.randomBytes(32).toString('hex');
  await storeOAuthState(state);
  passport.authenticate('github', { scope: ['user:email'], session: false, state })(req, res, next);
});

// @route   GET /api/v1/auth/github/callback
// @desc    GitHub OAuth callback with state validation
router.get('/github/callback', async (req, res, next) => {
  const { state } = req.query;
  if (!state || !(await validateOAuthState(state))) {
    return res.status(403).json({ error: 'Invalid OAuth state. Possible CSRF attack.' });
  }
  passport.authenticate('github', { failureRedirect: '/login', session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_denied`);
    req.user = user;
    authController.oauthCallback(req, res, next);
  })(req, res, next);
});

// Keep backward compatibility for the invite accept flow
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');
const { hashPassword } = require('../utils/hash');

router.get('/invitation/:token', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
      [req.params.token, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(400).json(envelope(null, { error: 'Invalid or expired invitation' }));
    }

    res.json(envelope(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// T7 Fix: Use centralized hashPassword (12 rounds) instead of inline bcrypt(10)
router.post('/accept-invite', async (req, res, next) => {
  const { token, password, bio, title } = req.body;

  try {
    const inviteResult = await db.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
      [token, 'pending']
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json(envelope(null, { error: 'Invalid or expired invitation' }));
    }

    const invite = inviteResult.rows[0];
    const hashedPassword = await hashPassword(password); // Consistent 12 rounds

    const userResult = await db.query(
      'INSERT INTO users (name, email, password, role, status, institution, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [invite.invitee_name, invite.invitee_email, hashedPassword, 'invited_user', 'active', 'Pending Verification', true]
    );

    const userId = userResult.rows[0].id;
    await db.query('INSERT INTO invited_user_profiles (user_id, title, academic_bio) VALUES ($1, $2, $3)', [userId, title, bio]);
    await db.query('UPDATE invitations SET status = $1 WHERE token = $2', ['accepted', token]);

    res.json(envelope({ message: 'Account activated successfully.' }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
