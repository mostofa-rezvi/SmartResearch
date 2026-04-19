const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { emitEvent } = require('../utils/kafkaEmitter');
const logger = require('../utils/logger');

const { sendEmail } = require('../utils/email');

class AuthService {
  async register(userData) {
    const { name, email, password, status, institution } = userData;

    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for registration

    const result = await db.query(
      'INSERT INTO users (name, email, password, role, status, institution, login_otp, login_otp_expires) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user', status, institution, otp, otpExpires]
    );

    const user = result.rows[0];

    // Rules #17: Emit Kafka events for significant user actions
    emitEvent('auth.user.registered', `user_${user.id}`, { userId: user.id, email: user.email, timestamp: new Date().toISOString() });
    
    logger.info({ userId: user.id, otp }, 'New user registered and OTP generated');

    // Send Welcome Email with OTP
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to ResearchBridge - Verify Your Email',
        text: `Hi ${user.name},\n\nWelcome to ResearchBridge! Your verification code is: ${otp}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h1 style="color: #333;">Welcome to ResearchBridge</h1>
          <p>Hi ${user.name},</p>
          <p>We are excited to have you on board. Please use the following code to verify your email address:</p>
          <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">${otp}</p>
          <p>This code will be valid for 24 hours.</p>
        </div>`
      });
    } catch (err) {
      logger.error('Failed to send welcome email');
    }

    return { ...user, otp_required: true };
  }

  async login(email, password) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Rules #7: Two-Step OTP. Generate and save OTP.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await db.query(
      'UPDATE users SET login_otp = $1, login_otp_expires = $2 WHERE id = $3',
      [otp, otpExpires, user.id]
    );

    // Send OTP via Email
    await sendEmail({
      to: user.email,
      subject: 'Your ResearchBridge Login OTP',
      text: `Your OTP for login is: ${otp}. It will expire in 10 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Login OTP</h2>
        <p>Your OTP for login is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
        <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>`
    });

    logger.info({ userId: user.id, otp }, 'OTP generated and sent via email');

    return { otp_required: true, message: 'OTP sent to your email' };
  }

  async verifyOtp(email, otp) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND login_otp = $2 AND login_otp_expires > NOW()',
      [email, otp]
    );

    if (result.rows.length === 0) {
      // Demo fallback removed for production standards.md compliance
      throw new Error('Invalid or expired OTP');
    }

    const user = result.rows[0];

    // Clear OTP
    await db.query('UPDATE users SET login_otp = NULL, login_otp_expires = NULL WHERE id = $1', [user.id]);

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        researcher_type: user.researcher_type,
        onboarding_completed: user.onboarding_completed
      }
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { user: payload.user, accessToken, refreshToken };
  }

  async completeOnboarding(userId, onboardingData) {
    const { interests, preferences } = onboardingData;

    await db.query(
      'UPDATE users SET research_interests = $1, onboarding_completed = TRUE WHERE id = $2',
      [JSON.stringify({ interests, preferences }), userId]
    );

    emitEvent('auth.onboarding.completed', `user_${userId}`, { userId, timestamp: new Date().toISOString() });
    
    return { message: 'Onboarding completed. Welcome to ResearchBridge.' };
  }
}

module.exports = new AuthService();
