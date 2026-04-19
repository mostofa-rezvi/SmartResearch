const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const { auth } = require('../middleware/auth');
const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');

// @route   POST /api/v1/auth/register
// @desc    Register a new user
router.post('/register', celebrate(authValidation.register), authController.register);

// @route   POST /api/v1/auth/login
// @desc    Step 1: Credentials login (Issues OTP)
router.post('/login', celebrate(authValidation.login), authController.login);

// @route   POST /api/v1/auth/verify-otp
// @desc    Step 2: Verify OTP and issue JWT
router.post('/verify-otp', celebrate(authValidation.verifyOtp), authController.verifyOtp);

// @route   POST /api/v1/auth/onboarding/complete
// @desc    Complete the mandatory onboarding conversation
router.post('/onboarding/complete', [auth, celebrate(authValidation.onboardingComplete)], authController.onboardingComplete);

// --- Remaining routes maintained for compatibility or specialized logic ---

// @route   GET /api/v1/auth/invitation/:token
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

// @route   POST /api/v1/auth/accept-invite
router.post('/accept-invite', async (req, res, next) => {
  // Logic remains here for now or can be moved to a service if it grows
  const { token, password, bio, title } = req.body;
  const bcrypt = require('bcryptjs');

  try {
    const inviteResult = await db.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
      [token, 'pending']
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json(envelope(null, { error: 'Invalid or expired invitation' }));
    }

    const invite = inviteResult.rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
