/**
 * audit.service.js
 * -----------------
 * Provides two responsibilities for the Researcher Credential Dashboard:
 *
 *  1. logProfileChange(userId, action, changedFields, oldValues, newValues, req)
 *     Writes an immutable row to profile_audit_logs.
 *     Called from profile.controller after every successful profile update.
 *
 *  2. checkAndAwardAchievements(userId, db)
 *     Evaluates all achievement conditions and upserts badges into
 *     user_achievements.  Runs after every profile update and after
 *     other platform events (paper save, connection, etc.).
 *
 * Achievement catalogue (type → thresholds):
 *   papers_saved        : 1(bronze) / 10(silver) / 25(gold) / 50(platinum)
 *   collaborator        : 1(bronze) / 3(silver) / 10(gold) / 25(platinum)
 *   community_voice     : 5(bronze) / 20(silver) / 50(gold) / 100(platinum)
 *   profile_complete    : 40%(bronze) / 70%(silver) / 90%(gold) / 100%(platinum)
 *   library_curator     : 5(bronze) / 20(silver) / 50(gold) / 100(platinum)
 */

const db = require('../config/db');
const logger = require('../utils/logger');

// ─── Achievement Catalogue ────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    type: 'papers_saved',
    label: 'Paper Archivist',
    description: 'Save research papers to your library',
    icon: '📚',
    thresholds: [
      { level: 'bronze',   min: 1  },
      { level: 'silver',   min: 10 },
      { level: 'gold',     min: 25 },
      { level: 'platinum', min: 50 },
    ],
    /**
     * @param {number} userId
     * @returns {Promise<number>} current count
     */
    async getCount(userId) {
      const { rows } = await db.query(
        `SELECT COUNT(*) AS cnt
           FROM reading_history
          WHERE user_id = $1 AND action = 'bookmark'`,
        [userId]
      );
      return parseInt(rows[0].cnt, 10);
    },
  },
  {
    type: 'collaborator',
    label: 'Collaborator',
    description: 'Connect with other researchers',
    icon: '🤝',
    thresholds: [
      { level: 'bronze',   min: 1  },
      { level: 'silver',   min: 3  },
      { level: 'gold',     min: 10 },
      { level: 'platinum', min: 25 },
    ],
    async getCount(userId) {
      const { rows } = await db.query(
        `SELECT COUNT(*) AS cnt
           FROM connections
          WHERE (requester_id = $1 OR recipient_id = $1)
            AND status = 'accepted'`,
        [userId]
      );
      return parseInt(rows[0].cnt, 10);
    },
  },
  {
    type: 'community_voice',
    label: 'Community Voice',
    description: 'Participate in community discussions',
    icon: '💬',
    thresholds: [
      { level: 'bronze',   min: 5   },
      { level: 'silver',   min: 20  },
      { level: 'gold',     min: 50  },
      { level: 'platinum', min: 100 },
    ],
    async getCount(userId) {
      const [posts, comments] = await Promise.all([
        db.query(`SELECT COUNT(*) AS cnt FROM community_posts WHERE author_id = $1`, [userId]),
        db.query(`SELECT COUNT(*) AS cnt FROM comments WHERE author_id = $1`, [userId]),
      ]);
      return parseInt(posts.rows[0].cnt, 10) + parseInt(comments.rows[0].cnt, 10);
    },
  },
  {
    type: 'library_curator',
    label: 'Library Curator',
    description: 'Build a rich reading history',
    icon: '📖',
    thresholds: [
      { level: 'bronze',   min: 5   },
      { level: 'silver',   min: 20  },
      { level: 'gold',     min: 50  },
      { level: 'platinum', min: 100 },
    ],
    async getCount(userId) {
      const { rows } = await db.query(
        `SELECT COUNT(DISTINCT paper_id) AS cnt FROM reading_history WHERE user_id = $1`,
        [userId]
      );
      return parseInt(rows[0].cnt, 10);
    },
  },
  {
    type: 'profile_complete',
    label: 'Credentialed Researcher',
    description: 'Complete your researcher profile',
    icon: '🎓',
    thresholds: [
      { level: 'bronze',   min: 40  },
      { level: 'silver',   min: 70  },
      { level: 'gold',     min: 90  },
      { level: 'platinum', min: 100 },
    ],
    async getCount(userId) {
      const { rows } = await db.query(
        `SELECT name, bio, avatar_url, institution_id,
                personal_website, linkedin_url, google_scholar_url,
                researchgate_url, educational_status, research_interests
           FROM users WHERE id = $1`,
        [userId]
      );
      if (!rows.length) return 0;
      const u = rows[0];
      const fields = [
        u.name, u.bio, u.avatar_url, u.institution_id,
        u.personal_website, u.linkedin_url, u.google_scholar_url,
        u.researchgate_url, u.educational_status,
        u.research_interests && JSON.stringify(u.research_interests) !== '{}' ? 'ok' : null,
      ];
      const filled = fields.filter(Boolean).length;
      return Math.round((filled / fields.length) * 100);
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given a count and a threshold array, return the highest earned level or null.
 */
function resolveLevel(count, thresholds) {
  // thresholds are ordered bronze → platinum
  let earned = null;
  for (const t of thresholds) {
    if (count >= t.min) earned = t.level;
  }
  return earned;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Append an immutable row to profile_audit_logs.
 *
 * @param {number}  userId
 * @param {string}  action         e.g. 'profile_update'
 * @param {string[]} changedFields  e.g. ['bio', 'institution_id']
 * @param {object}  oldValues      previous field values
 * @param {object}  newValues      incoming field values
 * @param {object}  [req]          express request (for IP / UA)
 */
async function logProfileChange(userId, action, changedFields, oldValues, newValues, req = {}) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || null;
    const ua = req.headers?.['user-agent'] || null;

    await db.query(
      `INSERT INTO profile_audit_logs
         (user_id, action, changed_fields, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, changedFields, JSON.stringify(oldValues), JSON.stringify(newValues), ip, ua]
    );
  } catch (err) {
    // Audit logging must never break the primary operation
    logger.error('Failed to write profile audit log', { userId, action, err: err.message });
  }
}

/**
 * Evaluate all achievements for a user and upsert any newly earned (or upgraded) badges.
 *
 * @param {number} userId
 * @returns {Promise<{ awarded: string[], upgraded: string[] }>}
 */
async function checkAndAwardAchievements(userId) {
  const awarded = [];
  const upgraded = [];

  for (const def of ACHIEVEMENTS) {
    try {
      const count = await def.getCount(userId);
      const level = resolveLevel(count, def.thresholds);
      if (!level) continue; // Not yet earned

      // Check existing badge
      const { rows } = await db.query(
        `SELECT achievement_level FROM user_achievements
          WHERE user_id = $1 AND achievement_type = $2`,
        [userId, def.type]
      );

      const LEVELS = ['bronze', 'silver', 'gold', 'platinum'];
      const existingLevel = rows[0]?.achievement_level;
      const currentIdx = LEVELS.indexOf(level);
      const existingIdx = LEVELS.indexOf(existingLevel);

      if (!existingLevel) {
        // Brand new badge
        await db.query(
          `INSERT INTO user_achievements (user_id, achievement_type, achievement_level, achievement_data)
           VALUES ($1, $2, $3, $4)`,
          [userId, def.type, level, JSON.stringify({ count, label: def.label, icon: def.icon })]
        );
        awarded.push(def.type);
      } else if (currentIdx > existingIdx) {
        // Level upgrade
        await db.query(
          `UPDATE user_achievements
              SET achievement_level = $1, achievement_data = $2, awarded_at = NOW()
            WHERE user_id = $3 AND achievement_type = $4`,
          [level, JSON.stringify({ count, label: def.label, icon: def.icon }), userId, def.type]
        );
        upgraded.push(def.type);
      }
    } catch (err) {
      logger.error('Achievement check failed', { userId, type: def.type, err: err.message });
    }
  }

  return { awarded, upgraded };
}

/**
 * Get paginated audit log for a user.
 *
 * @param {number} userId
 * @param {number} [page=1]
 * @param {number} [limit=20]
 */
async function getAuditLog(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT id, action, changed_fields, old_values, new_values, ip_address, created_at
       FROM profile_audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: total } = await db.query(
    `SELECT COUNT(*) AS cnt FROM profile_audit_logs WHERE user_id = $1`,
    [userId]
  );
  return { logs: rows, total: parseInt(total[0].cnt, 10) };
}

/**
 * Get all achievements for a user, including not-yet-earned ones (for progress display).
 *
 * @param {number} userId
 */
async function getAchievements(userId) {
  // Earned badges from DB
  const { rows: earned } = await db.query(
    `SELECT achievement_type, achievement_level, achievement_data, awarded_at
       FROM user_achievements
      WHERE user_id = $1`,
    [userId]
  );
  const earnedMap = Object.fromEntries(earned.map(r => [r.achievement_type, r]));

  // Build full catalogue with current progress
  const result = await Promise.all(
    ACHIEVEMENTS.map(async (def) => {
      const count = await def.getCount(userId);
      const level = resolveLevel(count, def.thresholds);
      const earnedBadge = earnedMap[def.type];

      // Next threshold to unlock
      const nextThreshold = def.thresholds.find(t => count < t.min) || null;

      return {
        type: def.type,
        label: def.label,
        description: def.description,
        icon: def.icon,
        current_count: count,
        earned_level: earnedBadge?.achievement_level || null,
        computed_level: level,
        awarded_at: earnedBadge?.awarded_at || null,
        next_threshold: nextThreshold ? { level: nextThreshold.level, required: nextThreshold.min } : null,
        thresholds: def.thresholds,
      };
    })
  );

  return result;
}

module.exports = { logProfileChange, checkAndAwardAchievements, getAuditLog, getAchievements };
