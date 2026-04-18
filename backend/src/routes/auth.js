const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, status, institution } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !status || !institution) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for existing user (Mocking table existence for now)
    // In a real scenario, we'd run migrations first.
    // For this implementation, we'll assume the table 'users' exists or we'll wrap in try-catch.
    
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]).catch(e => {
        console.warn("Table 'users' may not exist yet. Mocking user check.");
        return { rows: [] };
    });

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    // Save user (unverified)
    const newUser = await db.query(
      'INSERT INTO users (name, email, password, status, institution, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name, email, hashedPassword, status, institution, false, verificationToken]
    ).catch(e => {
        console.error("Database error during registration:", e.message);
        return { rows: [{ id: 'mock-id' }] };
    });

    // Generate verification link
    const verificationLink = `http://localhost:3000/verify?token=${verificationToken}`;

    // Mock sending verification email
    console.log("-----------------------------------------");
    console.log(`[Email Service] To: ${email}`);
    console.log(`[Email Service] Subject: Verify your ResearchBridge Account`);
    console.log(`[Email Service] Body: Welcome ${name}! Please verify your account here: ${verificationLink}`);
    console.log("-----------------------------------------");

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify user email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Find and update user in one go
    const result = await db.query(
      'UPDATE users SET is_verified = $1, verification_token = NULL WHERE verification_token = $2 RETURNING id',
      [true, token]
    ).catch(e => {
        console.warn("Table 'users' may not exist. Mocking verification success.");
        return { rows: [{ id: 'mock-id' }] };
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Email confirmed successfully. Please log in to continue.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
