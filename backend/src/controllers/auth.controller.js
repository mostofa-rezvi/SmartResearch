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

// Using centralized db pool from config

// --- Security Constants ---
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const AUTH_CODE_TTL_SECONDS = 60; // 1 minute single-use auth code

// Allowed redirect origins (T1 fix)
const ALLOWED_REDIRECT_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

const isAllowedRedirect = (url) => {
  return ALLOWED_REDIRECT_ORIGINS.some(origin => url.startsWith(origin));
};

class AuthController {
  async register(req, res, next) {
    const { name, email, password, status, institution, personal_website, linkedin_url, google_scholar_url, researchgate_url } = req.body;

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

      const insertResult = await db.query(
        `INSERT INTO users (
          name, email, password, verification_token, provider, 
          institution, researcher_type, educational_status,
          personal_website, linkedin_url, google_scholar_url, researchgate_url
        ) 
         VALUES ($1, $2, $3, $4, 'local', $5, $6, $7, $8, $9, $10, $11) 
         RETURNING id, name, email, is_verified`,
        [
          name, email, hashedPassword, verificationToken, 
          institution, researcher_type, educational_status,
          personal_website, linkedin_url, google_scholar_url, researchgate_url
        ]
      );

      const user = insertResult.rows[0];

      // Store verification token expiry in Redis (since schema doesn't have the column yet)
      const redis = getRedisClient();
      await redis.set(`verify_token:${verificationToken}`, user.id, 'EX', VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60);

      // Send verification email (Async - do not await to prevent blocking the response)
      const verifyUrl = `${ALLOWED_REDIRECT_ORIGINS[0]}/verify?token=${verificationToken}`;
      sendEmail({
        to: email,
        subject: 'Verify your ResearchBridge account',
        text: `Please verify your account by clicking this link: ${verifyUrl}`,
        html: `<p>Please verify your account by clicking this link: <a href="${verifyUrl}">Verify Account</a></p>`,
      }).catch(err => logger.error({ email, error: err.message }, 'Failed to send verification email in background'));


      res.status(201).json(envelope(user, { message: 'Registration successful. Please check your email to verify your account.' }));
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
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        
        await storeRefreshToken(refreshToken, user.id);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: config.env === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json(envelope({
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        }, { message: 'Login successful' }));
      } catch (e) {
        next(e);
      }
    })(req, res, next);
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
        await deleteRefreshToken(token);
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

      const result = await db.query(
        'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id',
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
      const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
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
    const { interests, preferences } = req.body;
    const userId = req.user.id;

    try {
      await db.query(
        'UPDATE users SET research_interests = $1, onboarding_completed = true, updated_at = NOW() WHERE id = $2',
        [JSON.stringify({ interests, preferences }), userId]
      );

      res.json(envelope({ message: 'Onboarding completed successfully' }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
