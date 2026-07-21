const db = require('../config/db');

class UserService {
  async getProfile(userId) {
    // 1. Base User Info (includes trust tier / verification / reputation for Module 9)
    const userResult = await db.query(
      `SELECT id, name, email, role, researcher_type, status, institution, research_interests,
              domain_tags, skills, bio, avatar_url, educational_status,
              personal_website, linkedin_url, google_scholar_url, researchgate_url,
              trust_tier, trust_rank, institution_verified, is_institutional,
              reputation_points, created_at
         FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const userProfile = userResult.rows[0];

    // 2. Fetch Extended Profile for Invited Users
    if (userProfile.role === 'invited_user') {
      const invitedResult = await db.query(
        'SELECT * FROM invited_user_profiles WHERE user_id = $1',
        [userId]
      );
      if (invitedResult.rows.length > 0) {
        userProfile.extended_profile = invitedResult.rows[0];
      }
    }

    // 3. Aggregate Community Activity (Living CV)
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM community_posts WHERE user_id = $1 AND type = 'question') as questions_asked,
        (SELECT COUNT(*) FROM community_posts WHERE user_id = $1 AND type = 'thought') as thoughts_shared,
        (SELECT COUNT(*) FROM comments WHERE user_id = $1) as comments_made,
        (SELECT COUNT(*) FROM saved_papers WHERE user_id = $1) as saved_papers_count,
        (SELECT COUNT(*) FROM group_members WHERE user_id = $1) as joined_groups_count
    `, [userId]);

    userProfile.activity_stats = statsResult.rows[0] || {
      questions_asked: 0, thoughts_shared: 0, comments_made: 0, saved_papers_count: 0, joined_groups_count: 0
    };

    // 4. Recent Activity Feed (Last 5 actions)
    const recentActivity = await db.query(`
      SELECT 'post' as type, id, title, content, created_at FROM community_posts WHERE user_id = $1
      UNION ALL
      SELECT 'comment' as type, id, NULL as title, content, created_at FROM comments WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    userProfile.recent_activity = recentActivity.rows;

    // 5. Collaborations formed (accepted connections) — Module 9
    const collabRes = await db.query(
      `SELECT COUNT(*)::int AS count FROM connections
        WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $1)`,
      [userId]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    userProfile.collaborations_count = collabRes.rows[0].count;

    // 6. Mentorship history (as mentor and as mentee) — Module 9
    const mentorshipRes = await db.query(
      `SELECT m.id, m.status, m.created_at,
              CASE WHEN m.mentor_id = $1 THEN 'mentor' ELSE 'mentee' END AS my_role,
              mentor.name AS mentor_name, mentee.name AS mentee_name
         FROM mentorships m
         JOIN users mentor ON m.mentor_id = mentor.id
         JOIN users mentee ON m.mentee_id = mentee.id
        WHERE (m.mentor_id = $1 OR m.mentee_id = $1) AND m.status = 'accepted'
        ORDER BY m.created_at DESC LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] }));
    userProfile.mentorship_history = mentorshipRes.rows;

    // 7. Public achievements / credentials (verifiable portfolio) — Module 9
    const achievementsRes = await db.query(
      `SELECT badge_type, title, description, earned_at
         FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC`,
      [userId]
    ).catch(() => ({ rows: [] }));
    userProfile.achievements = achievementsRes.rows;

    // 8. Authored / uploaded library items (papers) — Module 9
    const papersRes = await db.query(
      `SELECT id, title, item_type, doi, created_at FROM library_items
        WHERE user_id = $1 AND item_type = 'paper' ORDER BY created_at DESC LIMIT 20`,
      [userId]
    ).catch(() => ({ rows: [] }));
    userProfile.authored_papers = papersRes.rows;

    return userProfile;
  }

  async getReadingHistory(userId) {
    const result = await db.query(
      'SELECT id, paper_id, paper_title, paper_doi, action, read_at FROM reading_history WHERE user_id = $1 ORDER BY read_at DESC',
      [userId]
    );
    return result.rows;
  }

  async recordReadingHistory(userId, { paper_id, paper_title, paper_doi, action }) {
    const result = await db.query(
      'INSERT INTO reading_history (user_id, paper_id, paper_title, paper_doi, action) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, paper_id, paper_title, paper_doi, action]
    );

    // Feed forward behavioral signals to ML recommender
    try {
      const axios = require('axios');
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      await axios.post(`${ML_SERVICE_URL}/interactions`, {
        user_id: userId,
        item_id: paper_id || paper_doi,
        action: action
      });
    } catch (err) {
      const logger = require('../utils/logger');
      logger.error(`Failed to push reading interaction to ML Service: ${err.message}`);
    }

    return result.rows[0];
  }
}

module.exports = new UserService();

