const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');

const VALID_REACTIONS = ['insightful', 'support', 'curious', 'celebrate', 'love'];

class CommunityService {
  async createPost(userId, postData) {
    const { type, title, content, tags, group_id } = postData;

    const result = await db.query(
      'INSERT INTO community_posts (user_id, type, title, content, tags, group_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, type, title, content, JSON.stringify(tags || []), group_id || null]
    );

    const newPost = result.rows[0];
    const userResult = await db.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    newPost.author_name = userResult.rows[0].name;
    newPost.author_role = userResult.rows[0].role;
    newPost.vote_score = 0;
    newPost.comment_count = 0;
    newPost.reactions = {};

    eventBus.emitEvent('event.behaviour', { type: 'community.post.created', userId, postId: newPost.id, postType: type, timestamp: new Date().toISOString() });
    logger.info({ userId, postId: newPost.id }, 'Community post created');

    return newPost;
  }

  async getGroupFeed(groupId, userId) {
    const result = await db.query(`
      SELECT 
        p.*,
        u.name as author_name, u.role as author_role,
        COALESCE(v.vote_score, 0) as vote_score,
        COALESCE(v.upvotes, 0) as upvotes,
        COALESCE(v.downvotes, 0) as downvotes,
        COALESCE(c.comment_count, 0) as comment_count,
        uv.value as user_vote
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT 
          post_id, 
          SUM(value) as vote_score,
          COUNT(*) FILTER (WHERE value = 1) as upvotes,
          COUNT(*) FILTER (WHERE value = -1) as downvotes
        FROM votes WHERE comment_id IS NULL GROUP BY post_id
      ) v ON v.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id
      ) c ON c.post_id = p.id
      LEFT JOIN votes uv ON uv.post_id = p.id AND uv.user_id = $2 AND uv.comment_id IS NULL
      WHERE p.group_id = $1
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [groupId, userId]);

    const posts = result.rows;

    // Attach reactions for each post
    for (const post of posts) {
      const reactionResult = await db.query(
        `SELECT reaction_type, COUNT(*) as count, 
         MAX(CASE WHEN user_id = $2 THEN 1 ELSE 0 END) as user_reacted
         FROM post_reactions WHERE post_id = $1 GROUP BY reaction_type`,
        [post.id, userId]
      );
      post.reactions = {};
      post.user_reaction = null;
      reactionResult.rows.forEach(r => {
        post.reactions[r.reaction_type] = parseInt(r.count);
        if (parseInt(r.user_reacted) === 1) post.user_reaction = r.reaction_type;
      });
    }

    return posts;
  }

  async getFeed(userId) {
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [userId]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    const result = await db.query(`
      SELECT 
        p.*, u.name as author_name, u.role as author_role,
        COALESCE(v.vote_score, 0) as vote_score,
        COALESCE(c.comment_count, 0) as comment_count,
        uv.value as user_vote
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, SUM(value) as vote_score FROM votes WHERE comment_id IS NULL GROUP BY post_id
      ) v ON v.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id
      ) c ON c.post_id = p.id
      LEFT JOIN votes uv ON uv.post_id = p.id AND uv.user_id = $1 AND uv.comment_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 100
    `, [userId]);

    let posts = result.rows.map(post => {
      const matchCount = post.tags ? post.tags.filter(tag => interests.includes(tag)).length : 0;
      let score = (parseInt(post.vote_score) || 0) + (matchCount * 10);
      if (post.author_role === 'invited_user') score += 5;
      return {
        ...post,
        discovery_score: score,
        reactions: {},
        user_reaction: null,
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
    const existing = await db.query(
      'SELECT id FROM votes WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL',
      [userId, postId]
    );

    if (value === 0) {
      await db.query(
        'DELETE FROM votes WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL',
        [userId, postId]
      );
    } else if (existing.rows.length > 0) {
      await db.query(
        'UPDATE votes SET value = $3 WHERE user_id = $1 AND post_id = $2 AND comment_id IS NULL',
        [userId, postId, value]
      );
    } else {
      await db.query(
        'INSERT INTO votes (user_id, post_id, value) VALUES ($1, $2, $3)',
        [userId, postId, value]
      );
    }

    const counts = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE value = 1) as upvotes,
        COUNT(*) FILTER (WHERE value = -1) as downvotes,
        COALESCE(SUM(value), 0) as total
       FROM votes WHERE post_id = $1 AND comment_id IS NULL`,
      [postId]
    );
    const stats = counts.rows[0];

    eventBus.emitEvent('event.behaviour', { type: 'community.post.voted', userId, postId, value, timestamp: new Date().toISOString() });
    return { 
      vote_score: parseInt(stats.total), 
      upvotes: parseInt(stats.upvotes),
      downvotes: parseInt(stats.downvotes),
      user_vote: value 
    };
  }

  async react(userId, postId, reactionType) {
    if (!VALID_REACTIONS.includes(reactionType)) {
      const err = new Error('Invalid reaction type');
      err.statusCode = 400;
      throw err;
    }

    // Check existing reaction
    const existing = await db.query(
      'SELECT reaction_type FROM post_reactions WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].reaction_type === reactionType) {
        // Toggle off
        await db.query('DELETE FROM post_reactions WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      } else {
        // Change reaction
        await db.query(
          'UPDATE post_reactions SET reaction_type = $3 WHERE user_id = $1 AND post_id = $2',
          [userId, postId, reactionType]
        );
      }
    } else {
      await db.query(
        'INSERT INTO post_reactions (user_id, post_id, reaction_type) VALUES ($1, $2, $3)',
        [userId, postId, reactionType]
      );
    }

    // Return updated counts
    const result = await db.query(
      `SELECT reaction_type, COUNT(*) as count,
       MAX(CASE WHEN user_id = $2 THEN 1 ELSE 0 END) as user_reacted
       FROM post_reactions WHERE post_id = $1 GROUP BY reaction_type`,
      [postId, userId]
    );

    const reactions = {};
    let userReaction = null;
    result.rows.forEach(r => {
      reactions[r.reaction_type] = parseInt(r.count);
      if (parseInt(r.user_reacted) === 1) userReaction = r.reaction_type;
    });

    return { reactions, user_reaction: userReaction };
  }

  async getComments(postId, userId) {
    const result = await db.query(`
      SELECT c.*, u.name as author_name, u.role as author_role,
        COALESCE(v.vote_score, 0) as vote_score,
        uv.value as user_vote
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT comment_id, SUM(value) as vote_score FROM votes WHERE comment_id IS NOT NULL GROUP BY comment_id
      ) v ON v.comment_id = c.id
      LEFT JOIN votes uv ON uv.comment_id = c.id AND uv.user_id = $2
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId, userId]);

    return result.rows;
  }

  async addComment(userId, postId, content) {
    const result = await db.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, postId, content]
    );

    const comment = result.rows[0];
    const userResult = await db.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    comment.author_name = userResult.rows[0].name;
    comment.author_role = userResult.rows[0].role;
    comment.vote_score = 0;
    comment.user_vote = null;

    eventBus.emitEvent('event.behaviour', { type: 'community.comment.created', userId, postId, commentId: comment.id, timestamp: new Date().toISOString() });
    return comment;
  }

  async sharePost(userId, postId) {
    // Record share and return a shareable link reference
    const result = await db.query(
      'UPDATE community_posts SET share_count = COALESCE(share_count, 0) + 1 WHERE id = $1 RETURNING share_count',
      [postId]
    );

    eventBus.emitEvent('event.behaviour', { type: 'community.post.shared', userId, postId, timestamp: new Date().toISOString() });
    return { share_count: result.rows[0]?.share_count || 1 };
  }

  async deletePost(userId, postId) {
    const postRes = await db.query('SELECT user_id, group_id FROM community_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }
    const post = postRes.rows[0];

    const roleRes = await db.query('SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2', [userId, post.group_id]);
    const groupRole = roleRes.rows[0]?.role;

    // Permissions: Creator OR Admin OR Contributor
    if (post.user_id === userId || groupRole === 'admin' || groupRole === 'contributor') {
      await db.query('DELETE FROM community_posts WHERE id = $1', [postId]);
      return { success: true };
    } else {
      const err = new Error('Unauthorized to delete this post');
      err.statusCode = 403;
      throw err;
    }
  }

  async updatePost(userId, postId, data) {
    const postRes = await db.query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }
    
    if (postRes.rows[0].user_id !== userId) {
      const err = new Error('Only the creator can edit this post');
      err.statusCode = 403;
      throw err;
    }

    const { title, content, tags } = data;
    const result = await db.query(
      'UPDATE community_posts SET title = $1, content = $2, tags = $3 WHERE id = $4 RETURNING *',
      [title, content, JSON.stringify(tags || []), postId]
    );
    return result.rows[0];
  }

  async deleteComment(userId, commentId) {
    const commentRes = await db.query(
      'SELECT c.user_id, p.group_id FROM comments c JOIN community_posts p ON c.post_id = p.id WHERE c.id = $1',
      [commentId]
    );
    if (commentRes.rows.length === 0) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      throw err;
    }
    const comment = commentRes.rows[0];

    const roleRes = await db.query('SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2', [userId, comment.group_id]);
    const groupRole = roleRes.rows[0]?.role;

    // Permissions: Creator OR Admin OR Contributor
    if (comment.user_id === userId || groupRole === 'admin' || groupRole === 'contributor') {
      await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
      return { success: true };
    } else {
      const err = new Error('Unauthorized to delete this comment');
      err.statusCode = 403;
      throw err;
    }
  }

  async updateComment(userId, commentId, content) {
    const commentRes = await db.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (commentRes.rows.length === 0) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      throw err;
    }
    
    if (commentRes.rows[0].user_id !== userId) {
      const err = new Error('Only the creator can edit this comment');
      err.statusCode = 403;
      throw err;
    }

    const result = await db.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [content, commentId]
    );
    return result.rows[0];
  }
}

module.exports = new CommunityService();
