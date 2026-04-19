const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// @route   POST /api/admin/invite
// @desc    Initiate an exploration invite (Super Admin only)
router.post('/invite', auth, requireRole(['super_admin']), async (req, res) => {
  const { name, email } = req.body;

  try {
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already registered' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save invitation
    await db.query(
      'INSERT INTO invitations (inviter_id, invitee_name, invitee_email, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, name, email, token, expiresAt]
    );

    // Mock Email link
    const inviteLink = `http://localhost:3000/accept-invite?token=${token}`;
    console.log("-----------------------------------------");
    console.log(`[Admin Service] To: ${email}`);
    console.log(`[Admin Service] Subject: Exclusive Invitation to ResearchBridge`);
    console.log(`[Admin Service] Body: Welcome ${name}. Join our community: ${inviteLink}`);
    console.log("-----------------------------------------");

    res.json({ message: 'Invitation sent successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
