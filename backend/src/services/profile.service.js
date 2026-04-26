/**
 * Calculate profile completeness score (0-100)
 * @param {Object} user - User object with expanded fields
 * @returns {number} - Percentage score
 */
const calculateCompleteness = (user) => {
  let score = 0;

  // Name & Email (Basic) - 10%
  if (user.name && user.email) score += 10;

  // Bio - 20%
  if (user.bio && user.bio.trim().length > 0) score += 20;

  // Skills - 15%
  if (user.skills && user.skills.length > 0) score += 15;

  // Domains - 15%
  if (user.domains && user.domains.length > 0) score += 15;

  // Goals - 20%
  if (user.goals && user.goals.length > 0) score += 20;

  // Avatar - 10%
  if (user.avatar_url) score += 10;

  // Institution - 10%
  if (user.institution_id || user.institution) score += 10;

  return Math.min(score, 100);
};

module.exports = {
  calculateCompleteness,
};
