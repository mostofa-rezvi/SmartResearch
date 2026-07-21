const db = require('../config/db');
const { envelope } = require('../utils/responseEnvelope');
const { calculateCompleteness } = require('../services/profile.service');
const storageService = require('../services/storage.service');
const auditService = require('../services/audit.service');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const userId = req.params.id ? req.params.id : req.user.id;
      
      // 1. Get base user
      const userResult = await db.query(
        'SELECT id, name, email, bio, avatar_url, institution, institution_id, personal_website, linkedin_url, google_scholar_url, researchgate_url, educational_status, created_at, onboarding_completed, researcher_type FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
      }
      
      const user = userResult.rows[0];

      // 2. Get Institution
      if (user.institution_id) {
        const instResult = await db.query('SELECT * FROM institutions WHERE id = $1', [user.institution_id]);
        if (instResult.rows.length > 0) {
          user.institution_data = instResult.rows[0];
          user.institution = user.institution_data.name; // Use name for simple display
        }
      }

      // 3. Get Skills
      const skillsResult = await db.query(`
        SELECT s.id, s.name, s.category, us.proficiency 
        FROM skills s 
        JOIN user_skills us ON s.id = us.skill_id 
        WHERE us.user_id = $1
      `, [userId]);
      user.skills = skillsResult.rows;

      // 4. Get Domains
      const domainsResult = await db.query(`
        SELECT d.id, d.name, ud.is_primary 
        FROM domains d 
        JOIN user_domains ud ON d.id = ud.domain_id 
        WHERE ud.user_id = $1
      `, [userId]);
      user.domains = domainsResult.rows;

      // 5. Get Goals
      const goalsResult = await db.query(`
        SELECT g.id, g.name, ug.priority 
        FROM goals g 
        JOIN user_goals ug ON g.id = ug.goal_id 
        WHERE ug.user_id = $1
      `, [userId]);
      user.goals = goalsResult.rows;

      // 6. Calculate completeness score
      user.completeness_score = calculateCompleteness(user);

      res.json(envelope(user));
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    // In a real app, wrap this in a transaction
    const client = await db.pool.connect();
    try {
      const userId = req.user.id;
      const { 
        name, bio, institution_id, skills, domains, goals, research_interests,
        personal_website, linkedin_url, google_scholar_url, researchgate_url, educational_status
      } = req.body;

      await client.query('BEGIN');

      // ── Snapshot old values for audit log ──────────────────────────────────
      const TRACKED_FIELDS = [
        'name', 'bio', 'institution_id', 'personal_website',
        'linkedin_url', 'google_scholar_url', 'researchgate_url',
        'educational_status', 'research_interests',
      ];
      const { rows: snapshot } = await client.query(
        `SELECT ${TRACKED_FIELDS.join(', ')} FROM users WHERE id = $1`,
        [userId]
      );
      const oldValues = snapshot[0] || {};

      // 1. Update basic fields
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (bio !== undefined) {
        updates.push(`bio = $${paramCount++}`);
        values.push(bio);
      }
      if (institution_id !== undefined) {
        updates.push(`institution_id = $${paramCount++}`);
        values.push(institution_id);
      }
      if (research_interests !== undefined) {
        updates.push(`research_interests = $${paramCount++}`);
        values.push(JSON.stringify(research_interests));
      }
      if (personal_website !== undefined) {
        updates.push(`personal_website = $${paramCount++}`);
        values.push(personal_website);
      }
      if (linkedin_url !== undefined) {
        updates.push(`linkedin_url = $${paramCount++}`);
        values.push(linkedin_url);
      }
      if (google_scholar_url !== undefined) {
        updates.push(`google_scholar_url = $${paramCount++}`);
        values.push(google_scholar_url);
      }
      if (researchgate_url !== undefined) {
        updates.push(`researchgate_url = $${paramCount++}`);
        values.push(researchgate_url);
      }
      if (educational_status !== undefined) {
        updates.push(`educational_status = $${paramCount++}`);
        values.push(educational_status);
      }

      if (updates.length > 0) {
        values.push(userId);
        await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, values);
      }

      // 2. Update skills (simple replace strategy for now)
      if (skills !== undefined) {
        await client.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
        for (const skillId of skills) {
          await client.query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)', [userId, skillId]);
        }
      }

      // 3. Update domains
      if (domains !== undefined) {
        await client.query('DELETE FROM user_domains WHERE user_id = $1', [userId]);
        for (const domainId of domains) {
          await client.query('INSERT INTO user_domains (user_id, domain_id) VALUES ($1, $2)', [userId, domainId]);
        }
      }

      // 4. Update goals
      if (goals !== undefined) {
        await client.query('DELETE FROM user_goals WHERE user_id = $1', [userId]);
        for (const goalId of goals) {
          await client.query('INSERT INTO user_goals (user_id, goal_id) VALUES ($1, $2)', [userId, goalId]);
        }
      }

      await client.query('COMMIT');

      // ── Determine which fields actually changed ────────────────────────────
      const incomingBasic = {
        name, bio, institution_id, personal_website, linkedin_url,
        google_scholar_url, researchgate_url, educational_status, research_interests,
      };
      const changedFields = TRACKED_FIELDS.filter(f => {
        const incoming = incomingBasic[f];
        if (incoming === undefined) return false;
        return JSON.stringify(incoming) !== JSON.stringify(oldValues[f]);
      });

      // Add junction table changes
      if (skills !== undefined) changedFields.push('skills');
      if (domains !== undefined) changedFields.push('domains');
      if (goals !== undefined) changedFields.push('goals');

      // ── Fire-and-forget: audit log + achievement check ─────────────────────
      if (changedFields.length > 0) {
        const newValues = Object.fromEntries(
          changedFields.filter(f => TRACKED_FIELDS.includes(f)).map(f => [f, incomingBasic[f]])
        );
        const redactedOld = Object.fromEntries(
          changedFields.filter(f => TRACKED_FIELDS.includes(f)).map(f => [f, oldValues[f]])
        );

        auditService.logProfileChange(userId, 'profile_update', changedFields, redactedOld, newValues, req);
      }

      // Always re-check achievements after any profile update (completeness may have changed)
      auditService.checkAndAwardAchievements(userId).catch(() => {});

      // Fetch the updated profile to return
      const updatedUserResult = await db.query(
        'SELECT id, name, email, bio, avatar_url, institution_id, onboarding_completed, researcher_type FROM users WHERE id = $1',
        [userId]
      );
      const user = updatedUserResult.rows[0];
      
      res.json(envelope({ message: 'Profile updated successfully', user }));
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        const err = new Error('No file provided');
        err.statusCode = 400;
        throw err;
      }

      const userId = req.user.id;
      const avatarUrl = await storageService.uploadFile(req.file, 'avatars');

      // Snapshot old avatar for audit
      const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
      const oldAvatarUrl = rows[0]?.avatar_url || null;

      await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);

      // Audit log
      auditService.logProfileChange(
        userId,
        'avatar_update',
        ['avatar_url'],
        { avatar_url: oldAvatarUrl },
        { avatar_url: avatarUrl },
        req
      );

      // Re-check achievements (profile completeness may be affected)
      auditService.checkAndAwardAchievements(userId).catch(() => {});

      res.json(envelope({ avatar_url: avatarUrl }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/profiles/me/audit-log
   * Returns the paginated, append-only profile change history for the authenticated user.
   */
  async getAuditLog(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const result = await auditService.getAuditLog(userId, page, limit);
      res.json(envelope({ ...result, page, limit }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/profiles/me/audit-log/verify
   * Verifies the tamper-evidence of the append-only credential audit chain.
   */
  async verifyAuditLog(req, res, next) {
    try {
      const result = await auditService.verifyAuditChain(req.user.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/profiles/me/achievements
   * Returns the full achievement catalogue with current progress and earned badges.
   * Also triggers an achievement re-check so data is always fresh.
   */
  async getAchievements(req, res, next) {
    try {
      const userId = req.user.id;

      // Re-check achievements before returning (ensures DB is up-to-date)
      await auditService.checkAndAwardAchievements(userId);

      const achievements = await auditService.getAchievements(userId);
      res.json(envelope({ achievements }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
