const trust = require('../../src/services/trust.service');

describe('trust.service (Module 1 — institutional verification & tiers)', () => {
  describe('isInstitutionalEmail', () => {
    it.each([
      ['prof@mit.edu', true],
      ['student@dhaka.ac.bd', true],
      ['x@iub.edu.bd', true],
      ['y@ox.ac.uk', true],
      ['z@uni.edu.au', true],
      ['a@gmail.com', false],
      ['b@company.com', false],
      ['c@edu.com', false],       // .edu not at the end
      ['not-an-email', false],
      ['', false],
    ])('%s → %s', (email, expected) => {
      expect(trust.isInstitutionalEmail(email)).toBe(expected);
    });
  });

  describe('computeTrustTier', () => {
    it('professor role → professor', () => {
      expect(trust.computeTrustTier({ role: 'professor', is_verified: true })).toBe('professor');
      expect(trust.computeTrustTier({ role: 'invited_user' })).toBe('professor');
    });
    it('unverified email → unverified', () => {
      expect(trust.computeTrustTier({ is_verified: false, is_institutional: true })).toBe('unverified');
    });
    it('verified + institutional → verified', () => {
      expect(trust.computeTrustTier({ is_verified: true, is_institutional: true })).toBe('verified');
    });
    it('verified + non-institutional → basic', () => {
      expect(trust.computeTrustTier({ is_verified: true, is_institutional: false })).toBe('basic');
    });
  });

  describe('classifyAtRegistration', () => {
    it('academic email starts institutional but unverified', () => {
      expect(trust.classifyAtRegistration('a@dhaka.ac.bd')).toEqual({
        is_institutional: true, institution_verified: false, trust_tier: 'unverified',
      });
    });
  });

  describe('tierWeight', () => {
    it('orders authority professor > verified > basic > unverified', () => {
      expect(trust.tierWeight('professor')).toBeGreaterThan(trust.tierWeight('verified'));
      expect(trust.tierWeight('verified')).toBeGreaterThan(trust.tierWeight('basic'));
      expect(trust.tierWeight('basic')).toBeGreaterThan(trust.tierWeight('unverified'));
    });
  });
});
