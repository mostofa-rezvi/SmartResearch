const db = require('../config/db');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AdminService {
  async invite(inviterId, inviteData) {
    const { name, email } = inviteData;

    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      const err = new Error('User already registered');
      err.statusCode = 400;
      throw err;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.query(
      'INSERT INTO invitations (inviter_id, invitee_name, invitee_email, token, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [inviterId, name, email, token, expiresAt]
    );

    const inviteLink = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/accept-invite?token=${token}`;
    
    // Professional logging instead of console.log
    logger.info({ to: email, inviteLink }, 'Academic invitation generated');

    return { message: 'Invitation initiated successfully' };
  }
}

module.exports = new AdminService();
