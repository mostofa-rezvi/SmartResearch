const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');

class CommunityService {
  async createPost(userId, postData, io) {
    const { type, title, content, tags, group_id } = postData;

    const result = await db.query(
      'INSERT INTO community_posts (user_id, type, title, content, tags, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, type, title, content, JSON.stringify(tags || []), group_id || null]
    );

    const newPost = result.rows[0];

    // Enrich with author info
    const userResult = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    newPost.author_name = userResult.rows[0].name;
    newPost.vote_score = 0;
    newPost.comment_count = 0;

    // Emit live update
    if (io) {
      io.emit('new_post', newPost);
    }

    eventBus.emitEvent('event.behaviour', { type: 'community.post.created', userId, postId: newPost.id, postType: type, timestamp: new Date().toISOString() });
    
    logger.info({ userId, postId: newPost.id }, 'Community post created');

    return newPost;
  }

  async getFeed(userId) {
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [userId]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    const result = await db.query(`
      SELECT p.*, u.name as author_name, u.role as author_role,
      (SELECT COALESCE(SUM(value), 0) FROM votes WHERE post_id = p.id) as vote_score,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    // Blended Discovery Ranking Logic (moved from router for Rule #11)
    let posts = result.rows.map(post => {
      const matchCount = post.tags ? post.tags.filter(tag => interests.includes(tag)).length : 0;
      let score = (parseInt(post.vote_score) || 0) + (matchCount * 10);
      
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
    return posts;
  }

  async vote(userId, postId, value) {
    await db.query(`
      INSERT INTO votes (user_id, post_id, value) 
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, post_id, COALESCE(comment_id, -1)) 
      DO UPDATE SET value = $3
    `, [userId, postId, value]);

    eventBus.emitEvent('event.behaviour', { type: 'community.post.voted', userId, postId, value, timestamp: new Date().toISOString() });
    
    return { message: 'Vote recorded' };
  }
}

module.exports = new CommunityService();
