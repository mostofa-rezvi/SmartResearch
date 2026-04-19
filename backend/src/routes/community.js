const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

// @route   POST /api/community/posts
// @desc    Create a new post (Question or Thought)
router.post('/posts', auth, async (req, res) => {
  const { type, title, content, tags, group_id } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO community_posts (user_id, type, title, content, tags, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, type, title, content, JSON.stringify(tags || []), group_id || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/community/posts
// @desc    Get blended feed posts
router.get('/posts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.name as author_name, 
      (SELECT SUM(value) FROM votes WHERE post_id = p.id) as vote_score,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/community/posts/:id/vote
// @desc    Vote on a post
router.post('/posts/:id/vote', auth, async (req, res) => {
  const { value } = req.body; // 1 or -1

  try {
    await db.query(`
      INSERT INTO votes (user_id, post_id, value) 
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, post_id, comment_id) 
      DO UPDATE SET value = $3
    `, [req.user.id, req.params.id, value]);

    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
