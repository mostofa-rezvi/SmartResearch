const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireOnboarding } = require('../middleware/auth');
const { envelope } = require('../utils/responseEnvelope');
const { emitEvent } = require('../utils/kafkaEmitter');

// @route   POST /api/v1/community/posts
// @desc    Create a new post (Question or Thought)
router.post('/posts', [auth, requireOnboarding], async (req, res) => {
  const { type, title, content, tags, group_id } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO community_posts (user_id, type, title, content, tags, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, type, title, content, JSON.stringify(tags || []), group_id || null]
    );

    const newPost = result.rows[0];

    // Enrich with author name for the frontend
    const userResult = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    newPost.author_name = userResult.rows[0].name;
    newPost.vote_score = 0;
    newPost.comment_count = 0;

    // Emit live update via Socket.IO
    if (req.io) {
      req.io.emit('new_post', newPost);
    }

    // Architect: event-driven — triggers TrustScore computation downstream
    emitEvent('community.post.created', `user_${req.user.id}`, { userId: req.user.id, postId: newPost.id, type, timestamp: new Date().toISOString() });

    res.json(envelope(newPost));
  } catch (err) {
    console.error(err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/community/posts
// @desc    Get blended feed posts ranked by discovery module
router.get('/posts', [auth, requireOnboarding], async (req, res) => {
  try {
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [req.user.id]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    const result = await db.query(`
      SELECT p.*, u.name as author_name, u.role as author_role,
      (SELECT SUM(value) FROM votes WHERE post_id = p.id) as vote_score,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    // Discovery Ranking Logic
    let posts = result.rows.map(post => {
      const matchCount = post.tags ? post.tags.filter(tag => interests.includes(tag)).length : 0;
      let score = (parseInt(post.vote_score) || 0) + (matchCount * 10);
      
      // Boost posts from Verified Scholars (Invited Users)
      if (post.author_role === 'invited_user') {
         score += 5;
      }
      
      return { 
        ...post, 
        discovery_score: score, 
        matchedInterest: matchCount > 0 ? post.tags.find(tag => interests.includes(tag)) : null,
        // Constraint #8: Every recommendation must be explainable
        discovery_reason: matchCount > 0 
          ? `Matched your interest in "${post.tags.find(tag => interests.includes(tag))}"` 
          : post.author_role === 'invited_user' 
            ? 'From a verified scholar in your field' 
            : 'Trending in the community'
      };
    });

    posts.sort((a, b) => b.discovery_score - a.discovery_score);

    res.json(envelope(posts));
  } catch (err) {
    console.error(err.message);
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   POST /api/v1/community/posts/:id/vote
// @desc    Vote on a post
router.post('/posts/:id/vote', [auth, requireOnboarding], async (req, res) => {
  const { value } = req.body; // 1 or -1

  try {
    await db.query(`
      INSERT INTO votes (user_id, post_id, value) 
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, post_id, comment_id) 
      DO UPDATE SET value = $3
    `, [req.user.id, req.params.id, value]);

    res.json(envelope({ message: 'Vote recorded' }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
