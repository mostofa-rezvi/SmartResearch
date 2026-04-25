const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { Pool } = require('pg');
const crypto = require('crypto');
const config = require('./index');
const { comparePassword } = require('../utils/hash');

// Set up PostgreSQL pool
const pool = new Pool({
  connectionString: config.db.url,
});

// Allowed redirect origins for OAuth callbacks
const ALLOWED_REDIRECT_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

/**
 * Validate that a URL starts with an allowed origin.
 */
const isAllowedRedirect = (url) => {
  return ALLOWED_REDIRECT_ORIGINS.some(origin => url.startsWith(origin));
};

// Configure Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        if (user.provider !== 'local') {
          return done(null, false, { message: `Please login with ${user.provider}.` });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Helper for OAuth DB insert/select
const handleOAuthUser = async (profile, provider, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    // Check if user exists by provider and provider_id
    let result = await pool.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, profile.id]);
    let user = result.rows[0];

    if (user) {
      return done(null, user);
    }

    // Check if user exists by email (to avoid duplicate emails)
    if (email) {
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const existingUser = result.rows[0];
        // SECURITY FIX (T9): Do NOT silently link OAuth to existing local account.
        // Only link if the existing account was also created via OAuth (not local).
        if (existingUser.provider === 'local') {
          return done(null, false, { message: 'An account with this email already exists. Please log in with your password and link your social account from settings.' });
        }
        // If existing account is another OAuth provider, allow login (user owns the email via both providers)
        return done(null, existingUser);
      }
    }

    // Create new user
    const insertResult = await pool.query(
      `INSERT INTO users (name, email, provider, provider_id, is_verified) 
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [profile.displayName || profile.username || 'OAuth User', email || `${profile.id}@${provider}.com`, provider, profile.id]
    );

    return done(null, insertResult.rows[0]);
  } catch (err) {
    return done(err);
  }
};

/**
 * Generate a cryptographically random state parameter for OAuth CSRF protection.
 */
const generateOAuthState = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Configure Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => handleOAuthUser(profile, 'google', done)
    )
  );
}

// Configure GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/github/callback',
        scope: ['user:email']
      },
      (accessToken, refreshToken, profile, done) => handleOAuthUser(profile, 'github', done)
    )
  );
}

module.exports = passport;
module.exports.generateOAuthState = generateOAuthState;
module.exports.isAllowedRedirect = isAllowedRedirect;
