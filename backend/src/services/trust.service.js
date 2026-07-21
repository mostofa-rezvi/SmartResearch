const logger = require('../utils/logger');

/**
 * Trust tier & institutional verification service (Module 1).
 *
 * Institutional academic domains (.edu, .ac.bd, .edu.bd, .ac.uk, .edu.au, and
 * any `.ac.<cc>` / `.edu.<cc>` variant) are recognised automatically. Combined
 * with email verification and role, this yields a trust tier:
 *
 *   unverified  — registered, email not yet verified
 *   basic       — email verified, non-institutional
 *   verified    — email verified AND institutional domain
 *   professor   — verified role === 'professor'/'invited_user' (higher authority)
 */

// Academic TLD patterns (suffix match, case-insensitive)
const ACADEMIC_SUFFIXES = ['.edu', '.ac.bd', '.edu.bd', '.ac.uk', '.edu.au', '.ac.jp', '.edu.pk', '.ac.in', '.edu.cn'];
// Generic academic infixes: matches anything.ac.<cc> / anything.edu.<cc>
const ACADEMIC_INFIX = /\.(ac|edu)\.[a-z]{2,3}$/i;

/**
 * @param {string} email
 * @returns {boolean} true if the email domain is a recognised academic institution
 */
function isInstitutionalEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return false;
  const domain = email.split('@').pop().toLowerCase().trim();
  if (ACADEMIC_INFIX.test(domain)) return true;
  return ACADEMIC_SUFFIXES.some((s) => domain.endsWith(s));
}

/**
 * Compute the trust tier for a user.
 * @param {{ is_verified?: boolean, is_institutional?: boolean, role?: string }} user
 * @returns {'unverified'|'basic'|'verified'|'professor'}
 */
function computeTrustTier(user = {}) {
  const role = (user.role || '').toLowerCase();
  if (role === 'professor' || role === 'invited_user') return 'professor';
  if (!user.is_verified) return 'unverified';
  return user.is_institutional ? 'verified' : 'basic';
}

/**
 * Authority weight used by ranking/spam heuristics. Higher = more trusted.
 */
const TIER_WEIGHT = { unverified: 0.5, basic: 1.0, verified: 2.0, professor: 3.0 };

function tierWeight(tier) {
  return TIER_WEIGHT[tier] ?? 1.0;
}

/**
 * Given an email, return the initial institutional flags at registration time
 * (before email verification completes).
 */
function classifyAtRegistration(email) {
  const institutional = isInstitutionalEmail(email);
  return {
    is_institutional: institutional,
    institution_verified: false, // becomes true once email is verified
    trust_tier: 'unverified',
  };
}

module.exports = {
  isInstitutionalEmail,
  computeTrustTier,
  classifyAtRegistration,
  tierWeight,
  TIER_WEIGHT,
};
