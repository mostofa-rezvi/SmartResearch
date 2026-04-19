const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/users/:id/profile
// @desc    Get complete user profile including stats and extended fields
router.get('/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Base User Info
    const userResult = await db.query(
      'SELECT id, name, email, role, researcher_type, status, institution, research_interests, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
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

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
