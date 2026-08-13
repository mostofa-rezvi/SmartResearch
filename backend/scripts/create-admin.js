/**
 * create-admin.js
 * ---------------------------------------------------------------------------
 * Provision (or promote) a Staff Console super-administrator with a known,
 * properly-hashed password so you can sign in to /staff/2024/25/admin-panel.
 *
 * Idempotent: if the email already exists it is upgraded to super_admin and its
 * password is reset; otherwise a fresh verified, onboarded super_admin is made.
 *
 * Usage (from backend/):
 *   node scripts/create-admin.js
 *   ADMIN_EMAIL=you@school.edu ADMIN_PASSWORD='Str0ng!Pass' node scripts/create-admin.js
 *
 * Defaults (override with env for anything production-facing):
 *   ADMIN_EMAIL    = admin@researchbridge.app
 *   ADMIN_PASSWORD = Admin@2025!
 *   ADMIN_NAME     = Platform Administrator
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');

const EMAIL = (process.env.ADMIN_EMAIL || 'admin@researchbridge.app').toLowerCase().trim();
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2025!';
const NAME = process.env.ADMIN_NAME || 'Platform Administrator';

(async () => {
  try {
    const hashed = await hashPassword(PASSWORD);
    const existing = await db.query('SELECT id, role FROM users WHERE email = $1', [EMAIL]);

    if (existing.rows.length) {
      await db.query(
        `UPDATE users
            SET password = $1, name = $3, role = 'super_admin',
                is_verified = true, onboarding_completed = true
          WHERE email = $2`,
        [hashed, EMAIL, NAME]
      );
      console.log(`✓ Updated existing account "${EMAIL}" → super_admin (password reset).`);
    } else {
      await db.query(
        `INSERT INTO users (name, email, password, provider, role, is_verified, onboarding_completed)
         VALUES ($1, $2, $3, 'local', 'super_admin', true, true)`,
        [NAME, EMAIL, hashed]
      );
      console.log(`✓ Created new super_admin "${EMAIL}".`);
    }

    console.log('\n──────────────── Staff Console credentials ────────────────');
    console.log(`  URL:      /staff/2024/25/admin-panel`);
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log(`  Role:     super_admin`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('Note: if two-factor login (OTP_LOGIN_ENABLED) is on, a one-time');
    console.log('code is emailed to the admin address to finish signing in.');
    process.exit(0);
  } catch (err) {
    console.error('✗ create-admin failed:', err.message);
    process.exit(1);
  }
})();
