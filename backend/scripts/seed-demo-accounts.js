/**
 * seed-demo-accounts.js
 * ---------------------------------------------------------------------------
 * Provision 4 ready-to-use demo researcher accounts with a KNOWN password so
 * you can exercise the collaboration flows (connect, teams) across accounts.
 *
 * Each account is verified + onboarded. In non-production their two-factor login
 * OTP is always 123456 (see auth.controller `fixedLoginOtp`), so signing in is:
 *   email + password  →  OTP 123456.
 *
 * Idempotent: existing accounts are updated (password reset, flags set);
 * missing ones are created.
 *
 * Usage (from backend/):
 *   node scripts/seed-demo-accounts.js
 *   DEMO_PASSWORD='Str0ng!Pass' node scripts/seed-demo-accounts.js
 * ---------------------------------------------------------------------------
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');

const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@2025!';

const DEMO_ACCOUNTS = [
  { name: 'Dr. Aisha Rahman',  email: 'aisha.rahman@demo.researchbridge.test',  institution: 'MIT',                       researcher_type: 'amateur_researcher' },
  { name: 'Dr. Chen Wei',      email: 'chen.wei@demo.researchbridge.test',      institution: 'Tsinghua University',       researcher_type: 'amateur_researcher' },
  { name: 'Dr. Sofia Almeida', email: 'sofia.almeida@demo.researchbridge.test', institution: 'University of Lisbon',      researcher_type: 'amateur_researcher' },
  { name: 'Dr. Marcus Feld',   email: 'marcus.feld@demo.researchbridge.test',   institution: 'Max Planck Institute',      researcher_type: 'amateur_researcher' },
  { name: 'Priya Nair',        email: 'priya.nair@demo.researchbridge.test',    institution: 'IISc Bangalore',            researcher_type: 'new_researcher' },
  { name: 'Dr. Omar Haddad',   email: 'omar.haddad@demo.researchbridge.test',   institution: 'ETH Zurich',                researcher_type: 'amateur_researcher' },
  { name: 'Lucas Moreau',      email: 'lucas.moreau@demo.researchbridge.test',  institution: 'Sorbonne University',       researcher_type: 'new_researcher' },
  { name: 'Dr. Elena Petrova', email: 'elena.petrova@demo.researchbridge.test', institution: 'ETH Zurich',                researcher_type: 'amateur_researcher' },
];

async function columnExists(table, column) {
  const r = await db.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
    [table, column]
  );
  return r.rows.length > 0;
}

(async () => {
  try {
    const hasResearcherType = await columnExists('users', 'researcher_type');
    const hasInstitution = await columnExists('users', 'institution');
    const hashed = await hashPassword(PASSWORD);

    for (const acc of DEMO_ACCOUNTS) {
      const email = acc.email.toLowerCase();
      const existing = await db.query('SELECT id FROM users WHERE lower(email) = $1', [email]);

      if (existing.rows.length) {
        const sets = ['password = $1', 'name = $2', "role = 'user'", 'is_verified = true', 'onboarding_completed = true'];
        const params = [hashed, acc.name];
        if (hasResearcherType) { params.push(acc.researcher_type); sets.push(`researcher_type = $${params.length}`); }
        if (hasInstitution) { params.push(acc.institution); sets.push(`institution = $${params.length}`); }
        params.push(email);
        await db.query(`UPDATE users SET ${sets.join(', ')} WHERE lower(email) = $${params.length}`, params);
        console.log(`✓ Updated  ${acc.name} <${email}>`);
      } else {
        const cols = ['name', 'email', 'password', 'provider', 'role', 'is_verified', 'onboarding_completed'];
        const vals = [acc.name, email, hashed, 'local', 'user', true, true];
        if (hasResearcherType) { cols.push('researcher_type'); vals.push(acc.researcher_type); }
        if (hasInstitution) { cols.push('institution'); vals.push(acc.institution); }
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
        await db.query(`INSERT INTO users (${cols.join(',')}) VALUES (${placeholders})`, vals);
        console.log(`✓ Created  ${acc.name} <${email}>`);
      }
    }

    console.log('\n──────────────── Demo accounts ready ────────────────');
    DEMO_ACCOUNTS.forEach((a, i) => console.log(`  ${i + 1}. ${a.email}`));
    console.log(`\n  Password (all):  ${PASSWORD}`);
    console.log('  Login OTP:       123456  (fixed in non-production)');
    console.log('  Sign in at:      /login');
    console.log('─────────────────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('✗ seed-demo-accounts failed:', err.message);
    process.exit(1);
  }
})();
