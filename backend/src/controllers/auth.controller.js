const passport = require('passport');
const crypto = require('crypto');
const { v4: uuidv4 } = { v4: () => crypto.randomUUID() };
const db = require('../config/db');
const config = require('../config/index');
const { hashPassword } = require('../utils/hash');
const { sendEmail } = require('../utils/email');
const { generateAccessToken, generateRefreshToken, storeRefreshToken, getUserIdFromRefreshToken, deleteRefreshToken, verifyToken } = require('../services/token.service');
const { getRedisClient } = require('../config/redis');
const { envelope, errorEnvelope } = require('../utils/responseEnvelope');
const logger = require('../utils/logger');
const eventBus = require('../services/eventBus.service');
const trustService = require('../services/trust.service');

// Using centralized db pool from config

// --- Security Constants ---
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const AUTH_CODE_TTL_SECONDS = 60; // 1 minute single-use auth code
const REGISTER_OTP_TTL_SECONDS = 15 * 60; // 15 minutes to confirm a new account
const RESET_OTP_TTL_SECONDS = 15 * 60;    // 15 minutes to reset a password

// Allowed redirect origins (T1 fix)
const ALLOWED_REDIRECT_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

const isAllowedRedirect = (url) => {
  return ALLOWED_REDIRECT_ORIGINS.some(origin => url.startsWith(origin));
};

// ── OTP (two-factor login) helpers ──────────────────────────────────────────────
const OTP_EXPIRY_SECONDS = (config.otp?.expiryMinutes || 5) * 60;

/** Issue an access token, store+cookie a refresh token, and return the session payload. */
async function issueSession(res, userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  await storeRefreshToken(refreshToken, userId);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const result = await db.query(
    'SELECT id, name, email, role, onboarding_completed, researcher_type FROM users WHERE id = $1',
    [userId]
  );
  return { accessToken, user: result.rows[0] };
}

/** Generate a 6-digit login OTP, store it in Redis (keyed by id + email), and email it. */
async function sendLoginOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000));
  const redis = getRedisClient();
  await redis.set(`login_otp:${user.id}`, otp, 'EX', OTP_EXPIRY_SECONDS);
  await redis.set(`login_otp_email:${user.email}`, String(user.id), 'EX', OTP_EXPIRY_SECONDS);
  sendEmail({
    to: user.email,
    subject: 'Your ResearchBridge login code',
    text: `Your ResearchBridge verification code is ${otp}. It expires in ${config.otp?.expiryMinutes || 5} minutes.`,
    html: `<p>Your ResearchBridge verification code is <b style="font-size:22px;letter-spacing:3px">${otp}</b>.</p>` +
          `<p>It expires in ${config.otp?.expiryMinutes || 5} minutes. If you did not try to sign in, you can ignore this email.</p>`,
  }).catch((err) => logger.error({ email: user.email, error: err.message }, 'Failed to send login OTP email'));
  logger.info(`[Auth] Login OTP issued for user ${user.id}`);
  return otp;
}

/** Generate a 6-digit account-verification OTP, store it in Redis, and email it. */
async function sendRegisterOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000));
  const redis = getRedisClient();
  await redis.set(`register_otp:${user.id}`, otp, 'EX', REGISTER_OTP_TTL_SECONDS);
  await redis.set(`register_otp_email:${user.email}`, String(user.id), 'EX', REGISTER_OTP_TTL_SECONDS);
  sendEmail({
    to: user.email,
    subject: 'Verify your ResearchBridge account',
    text: `Welcome to ResearchBridge! Your verification code is ${otp}. It expires in 15 minutes.`,
    html: `<p>Welcome to ResearchBridge! Confirm your email with the code below:</p>` +
          `<p style="font-size:26px;font-weight:800;letter-spacing:6px;color:#0A192F">${otp}</p>` +
          `<p>This code expires in 15 minutes. If you didn't create an account, you can ignore this email.</p>`,
  }).catch((err) => logger.error({ email: user.email, error: err.message }, 'Failed to send registration OTP email'));
  logger.info(`[Auth] Registration OTP issued for user ${user.id}`);
  return otp;
}

/** Generate a 6-digit password-reset OTP, store it in Redis (keyed by email), and email it. */
async function sendResetOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000));
  const redis = getRedisClient();
  await redis.set(`reset_otp:${user.email}`, otp, 'EX', RESET_OTP_TTL_SECONDS);
  sendEmail({
    to: user.email,
    subject: 'Reset your ResearchBridge password',
    text: `Your ResearchBridge password reset code is ${otp}. It expires in 15 minutes.`,
    html: `<p>We received a request to reset your ResearchBridge password. Use the code below:</p>` +
          `<p style="font-size:26px;font-weight:800;letter-spacing:6px;color:#0A192F">${otp}</p>` +
          `<p>This code expires in 15 minutes. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>`,
  }).catch((err) => logger.error({ email: user.email, error: err.message }, 'Failed to send password reset OTP email'));
  logger.info(`[Auth] Password reset OTP issued for user ${user.id}`);
  return otp;
}

class AuthController {
  async register(req, res, next) {
    const { name, email, password, status, institution, personal_website, linkedin_url, google_scholar_url, researchgate_url,
      research_interests, domain_tags, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(errorEnvelope('Name, email, and password are required', 400));
    }

    // T5 Fix: Password complexity validation
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json(errorEnvelope(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`, 400));
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json(errorEnvelope('Password must contain at least one uppercase letter, one lowercase letter, and one digit.', 400));
    }

    try {
      // Check if user exists
      const checkResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (checkResult.rows.length > 0) {
        return res.status(409).json(errorEnvelope('Email already in use', 409));
      }

      const hashedPassword = await hashPassword(password);
      const verificationToken = uuidv4();

      // T6 Fix: Set verification token expiry
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Map status to researcher_type or educational_status
      let researcher_type = null;
      let educational_status = null;
      
      const researcherTypes = ['new', 'amateur'];
      if (researcherTypes.includes(status)) {
        researcher_type = status === 'new' ? 'new_researcher' : 'amateur_researcher';
      } else {
        educational_status = status;
      }

      // Module 1: automatic institutional-domain detection (.edu/.ac.bd/...) → trust tier
      const trust = trustService.classifyAtRegistration(email);

      // Optional research interests / domain tags / skills collected at registration
      const interestsJson = JSON.stringify(Array.isArray(research_interests) ? research_interests : []);
      const domainTagsJson = JSON.stringify(Array.isArray(domain_tags) ? domain_tags : []);
      const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);

      const insertResult = await db.query(
        `INSERT INTO users (
          name, email, password, verification_token, provider,
          institution, researcher_type, educational_status,
          personal_website, linkedin_url, google_scholar_url, researchgate_url,
          is_institutional, institution_verified, trust_tier,
          research_interests, domain_tags, skills
        )
         VALUES ($1, $2, $3, $4, 'local', $5, $6, $7, $8, $9, $10, $11,
                 $12, $13, $14, $15, $16, $17)
         RETURNING id, name, email, is_verified, is_institutional, trust_tier`,
        [
          name, email, hashedPassword, verificationToken,
          institution, researcher_type, educational_status,
          personal_website, linkedin_url, google_scholar_url, researchgate_url,
          trust.is_institutional, trust.institution_verified, trust.trust_tier,
          interestsJson, domainTagsJson, skillsJson
        ]
      );

      const user = insertResult.rows[0];

      // Emit profile.created so the search (ES) + graph (Neo4j) sync workers fire.
      eventBus.emitEvent('profile.created', {
        id: user.id,
        name,
        email,
        institution: institution || '',
        is_institutional: trust.is_institutional,
        trust_tier: trust.trust_tier,
        research_interests: Array.isArray(research_interests) ? research_interests : [],
        domain_tags: Array.isArray(domain_tags) ? domain_tags : [],
        bio: '',
      }).catch((e) => logger.warn(`[register] profile.created emit failed: ${e.message}`));

      // Store verification token expiry in Redis (kept for the legacy /verify link flow)
      const redis = getRedisClient();
      await redis.set(`verify_token:${verificationToken}`, user.id, 'EX', VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60);

      // Email a 6-digit verification code (OTP) the user enters to confirm the account.
      const otp = await sendRegisterOtp({ id: user.id, email });

      const payload = { ...user, otp_required: true, email };
      // Dev convenience only — never expose the code in production
      if (config.env !== 'production') payload.dev_otp = otp;

      res.status(201).json(envelope(payload, { message: 'Registration successful. Enter the verification code we emailed to activate your account.' }));
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json(errorEnvelope(info.message || 'Authentication failed', 401));
      }

      if (user.provider === 'local' && !user.is_verified) {
        return res.status(403).json(errorEnvelope('Please verify your email before logging in.', 403));
      }

      try {
        // Two-factor: when enabled, email a one-time code and require /verify-otp
        // to complete login. Disabled by default → direct token (below).
        if (config.otp?.loginEnabled) {
          const otp = await sendLoginOtp(user);
          const payload = {
            otp_required: true,
            email: user.email,
            message: 'A one-time verification code was sent to your email.',
          };
          // Dev convenience only — never expose the code in production
          if (config.env !== 'production') payload.dev_otp = otp;
          return res.json(envelope(payload));
        }

        const session = await issueSession(res, user.id);
        res.json(envelope(session, { message: 'Login successful' }));
      } catch (e) {
        next(e);
      }
    })(req, res, next);
  }

  /**
   * POST /api/v1/auth/verify-otp — complete a two-factor login.
   * Verifies { email, otp } against Redis and issues session tokens.
   */
  async verifyOtp(req, res, next) {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(errorEnvelope('Email and verification code are required', 400));
    }
    try {
      const redis = getRedisClient();
      const userId = await redis.get(`login_otp_email:${email}`);
      if (!userId) {
        return res.status(401).json(errorEnvelope('Code expired or not requested. Please sign in again.', 401));
      }
      const stored = await redis.get(`login_otp:${userId}`);
      if (!stored || stored !== String(otp).trim()) {
        return res.status(401).json(errorEnvelope('Invalid verification code.', 401));
      }
      // Single-use
      await redis.del(`login_otp:${userId}`);
      await redis.del(`login_otp_email:${email}`);

      const session = await issueSession(res, userId);
      res.json(envelope(session, { message: 'Login successful' }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/resend-otp — re-issue a login code.
   * Does not reveal whether the account exists.
   */
  async resendOtp(req, res, next) {
    const { email } = req.body;
    if (!email) return res.status(400).json(errorEnvelope('Email is required', 400));
    try {
      const result = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.json(envelope({ message: 'If the account exists, a new code was sent.' }));
      }
      const otp = await sendLoginOtp(result.rows[0]);
      const payload = { message: 'A new verification code was sent.' };
      if (config.env !== 'production') payload.dev_otp = otp;
      res.json(envelope(payload));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/verify-registration — confirm a new account with the emailed
   * OTP. Marks the account verified, upgrades trust tier, and signs the user in.
   */
  async verifyRegistration(req, res, next) {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(errorEnvelope('Email and verification code are required', 400));
    }
    try {
      const redis = getRedisClient();
      const userId = await redis.get(`register_otp_email:${email}`);
      if (!userId) {
        return res.status(401).json(errorEnvelope('Code expired or not requested. Please register again or resend the code.', 401));
      }
      const stored = await redis.get(`register_otp:${userId}`);
      if (!stored || stored !== String(otp).trim()) {
        return res.status(401).json(errorEnvelope('Invalid verification code.', 401));
      }

      // Mark verified + upgrade trust tier (mirrors the /verify-email link flow).
      const result = await db.query(
        `UPDATE users
            SET is_verified = true,
                verification_token = NULL,
                institution_verified = is_institutional,
                trust_tier = CASE
                  WHEN role IN ('professor','invited_user') THEN 'professor'
                  WHEN is_institutional THEN 'verified'
                  ELSE 'basic'
                END
          WHERE id = $1
          RETURNING id`,
        [userId]
      );
      if (result.rowCount === 0) {
        return res.status(400).json(errorEnvelope('Account not found. Please register again.', 400));
      }

      // Single-use — clear the codes.
      await redis.del(`register_otp:${userId}`);
      await redis.del(`register_otp_email:${email}`);

      const session = await issueSession(res, userId);
      res.json(envelope(session, { message: 'Account verified! Welcome to ResearchBridge.' }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/resend-registration-otp — re-issue an account-verification
   * code. Does not reveal whether an account exists.
   */
  async resendRegistrationOtp(req, res, next) {
    const { email } = req.body;
    if (!email) return res.status(400).json(errorEnvelope('Email is required', 400));
    try {
      const result = await db.query('SELECT id, email, is_verified FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      // Only unverified accounts get a fresh code; response is always generic.
      if (user && !user.is_verified) {
        const otp = await sendRegisterOtp(user);
        const payload = { message: 'A new verification code was sent.' };
        if (config.env !== 'production') payload.dev_otp = otp;
        return res.json(envelope(payload));
      }
      res.json(envelope({ message: 'If the account exists and is unverified, a new code was sent.' }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password — begin a password reset. Emails a 6-digit
   * OTP if the account exists. Always returns a generic success (no account
   * enumeration).
   */
  async forgotPassword(req, res, next) {
    const { email } = req.body;
    if (!email) return res.status(400).json(errorEnvelope('Email is required', 400));
    try {
      const result = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      const payload = { message: 'If an account exists for that email, a reset code has been sent.' };
      if (user) {
        const otp = await sendResetOtp(user);
        if (config.env !== 'production') payload.dev_otp = otp;
      }
      res.json(envelope(payload));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/reset-password — complete a password reset with the emailed
   * OTP and a new password. Invalidates the code on success.
   */
  async resetPassword(req, res, next) {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json(errorEnvelope('Email, code, and new password are required', 400));
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json(errorEnvelope(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`, 400));
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json(errorEnvelope('Password must contain at least one uppercase letter, one lowercase letter, and one digit.', 400));
    }
    try {
      const redis = getRedisClient();
      const stored = await redis.get(`reset_otp:${email}`);
      if (!stored) {
        return res.status(401).json(errorEnvelope('Reset code expired or not requested. Please start again.', 401));
      }
      if (stored !== String(otp).trim()) {
        return res.status(401).json(errorEnvelope('Invalid reset code.', 401));
      }

      const hashedPassword = await hashPassword(password);
      const result = await db.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
        [hashedPassword, email]
      );
      if (result.rowCount === 0) {
        return res.status(400).json(errorEnvelope('Account not found.', 400));
      }

      // Single-use — invalidate the code.
      await redis.del(`reset_otp:${email}`);

      res.json(envelope({}, { message: 'Password reset successfully. You can now sign in with your new password.' }));
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json(errorEnvelope('No refresh token provided', 401));
    }

    try {
      // Verify JWT signature and expiration
      const decoded = verifyToken(token, config.jwt.refreshSecret);
      const userId = decoded.id;

      // Check if it exists in Redis (not blacklisted/expired)
      const storedUserId = await getUserIdFromRefreshToken(token);
      
      if (!storedUserId || storedUserId.toString() !== userId.toString()) {
        return res.status(401).json(errorEnvelope('Invalid refresh token', 401));
      }

      // Delete old token (Rotation)
      await deleteRefreshToken(token);

      // Issue new tokens
      const newAccessToken = generateAccessToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      await storeRefreshToken(newRefreshToken, userId);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(envelope({ accessToken: newAccessToken }));
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json(errorEnvelope('Refresh token expired. Please log in again.', 401));
      }
      return res.status(401).json(errorEnvelope('Invalid refresh token', 401));
    }
  }

  async logout(req, res, next) {
    const token = req.cookies.refreshToken;
    
    try {
      if (token) {
        await deleteRefreshToken(token, true);
        res.clearCookie('refreshToken');
      }
      res.json(envelope({}, { message: 'Logged out successfully' }));
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json(errorEnvelope('Verification token is required', 400));
    }

    try {
      // T6 Fix: Check Redis for token expiry
      const redis = getRedisClient();
      const storedUserId = await redis.get(`verify_token:${token}`);
      
      if (!storedUserId) {
        return res.status(400).json(errorEnvelope('Invalid, expired, or already verified token. If you are already verified, please try logging in.', 400));
      }

      // On verify: mark verified, and upgrade trust tier + institutional verification.
      // institution_verified becomes true only when the (now-verified) email is on an academic domain.
      const result = await db.query(
        `UPDATE users
            SET is_verified = true,
                verification_token = NULL,
                institution_verified = is_institutional,
                trust_tier = CASE
                  WHEN role IN ('professor','invited_user') THEN 'professor'
                  WHEN is_institutional THEN 'verified'
                  ELSE 'basic'
                END
          WHERE verification_token = $1
          RETURNING id, trust_tier, is_institutional`,
        [token]
      );

      if (result.rowCount === 0) {
        return res.status(400).json(errorEnvelope('Invalid, expired, or already verified token. If you are already verified, please try logging in.', 400));
      }

      // Clean up Redis
      await redis.del(`verify_token:${token}`);

      res.json(envelope({}, { message: 'Email verified successfully. You can now log in.' }));
    } catch (err) {
      next(err);
    }
  }

  // T2 Fix: OAuth callback now issues a short-lived auth code instead of exposing JWT in URL
  async oauthCallback(req, res, next) {
    const user = req.user;

    try {
      // Generate a short-lived, single-use auth code
      const authCode = crypto.randomBytes(32).toString('hex');
      const redis = getRedisClient();
      await redis.set(`auth_code:${authCode}`, JSON.stringify({ userId: user.id }), 'EX', AUTH_CODE_TTL_SECONDS);

      // T1 Fix: Validate redirect URL
      const frontendUrl = ALLOWED_REDIRECT_ORIGINS[0];
      const redirectUrl = `${frontendUrl}/oauth-success?code=${authCode}`;
      
      if (!isAllowedRedirect(redirectUrl)) {
        logger.error({ redirectUrl }, 'OAuth redirect blocked: URL not in allowed origins');
        return res.status(403).json(errorEnvelope('Redirect URL not allowed', 403));
      }

      res.redirect(redirectUrl);
    } catch (err) {
      // T8 Fix: Use structured logging instead of console.error
      logger.error({ error: err.message }, 'OAuth callback error');
      const frontendUrl = ALLOWED_REDIRECT_ORIGINS[0];
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  // New endpoint: Exchange auth code for tokens (T2 fix companion)
  async exchangeAuthCode(req, res, next) {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(errorEnvelope('Auth code is required', 400));
    }

    try {
      const redis = getRedisClient();
      const data = await redis.get(`auth_code:${code}`);

      if (!data) {
        return res.status(401).json(errorEnvelope('Invalid or expired auth code', 401));
      }

      // Delete immediately (single-use)
      await redis.del(`auth_code:${code}`);

      const { userId } = JSON.parse(data);
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      await storeRefreshToken(refreshToken, userId);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Get user info
      const result = await db.query('SELECT id, name, email, role, onboarding_completed, researcher_type FROM users WHERE id = $1', [userId]);
      const user = result.rows[0];

      res.json(envelope({
        accessToken,
        user,
      }, { message: 'OAuth login successful' }));
    } catch (err) {
      next(err);
    }
  }

  async completeOnboarding(req, res, next) {
    const { answers, completedAt } = req.body;
    const userId = req.user.id;

    try {
      await db.query('BEGIN');
      
      // Save all answers
      for (const [questionId, answerData] of Object.entries(answers || {})) {
        await db.query(
          `INSERT INTO onboarding_answers (user_id, question_id, answer_data)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, question_id) DO UPDATE SET answer_data = $3, created_at = NOW()`,
          [userId, questionId, JSON.stringify(answerData)]
        );
      }

      // Update user status
      await db.query(
        'UPDATE users SET onboarding_completed = true, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      
      await db.query('COMMIT');

      // Clear recommendation cache in Redis to trigger dynamic update
      try {
        const redis = getRedisClient();
        if (redis) {
          await redis.del(`rec:v1:${userId}`);
          logger.info(`Cleared recommendation cache in Redis for user ${userId}`);
        }
      } catch (redisErr) {
        logger.error(`Failed to clear recommendation cache: ${redisErr.message}`);
      }

      res.json(envelope({ message: 'Onboarding completed successfully' }));
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    }
  }
}

module.exports = new AuthController();
