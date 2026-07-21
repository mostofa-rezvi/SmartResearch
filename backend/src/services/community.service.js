const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');
const reputationService = require('./reputation.service');
const socketService = require('./socket.service');
const axios = require('axios');
const { sanitizeText } = require('../utils/sanitize');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const VALID_REACTIONS = ['insightful', 'support', 'curious', 'celebrate', 'love'];

class CommunityService {
  async createPost(userId, postData) {
    const { type, group_id } = postData;
    // Sanitize user-generated content before persisting
    const title = sanitizeText(postData.title);
    const content = sanitizeText(postData.content);
    const tags = postData.tags;

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

    // Broadcast to all users for real-time feed updates
    socketService.broadcast('new_post', newPost);

    // Module 5: embed the post into the shared semantic space (fire-and-forget)
    this._indexPostSemantically(newPost).catch((e) =>
      logger.warn(`[Community] post semantic index failed: ${e.message}`));

    logger.info({ userId, postId: newPost.id }, 'Community post created');


    return newPost;
  }

  /** Embed a forum post and index it into the ES `posts` index (same 768-dim space as profiles/papers). */
  async _indexPostSemantically(post) {
    const text = [post.title, post.content].filter(Boolean).join('. ');
    if (!text.trim()) return;
    let embedding = null;
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/embed`, { text }, { timeout: 30000 });
      embedding = res.data?.embedding || res.data?.vectors || null;
    } catch (e) {
      logger.warn(`[Community] embed for post ${post.id} failed: ${e.message}`);
    }
    const { getEsClient } = require('../config/elasticsearch');
    const document = {
      title: post.title || '', content: post.content || '',
      type: post.type || 'discussion', author_id: post.user_id,
    };
    if (Array.isArray(embedding) && embedding.length > 0) document.embedding = embedding;
    await getEsClient().index({ index: 'posts', id: String(post.id), document });
  }

  async getGroupFeed(groupId, userId, limit = 20, offset = 0) {
    const countResult = await db.query(`
      SELECT COUNT(*) FROM community_posts WHERE group_id = $1
    `, [groupId]);

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
      LIMIT $3 OFFSET $4
    `, [groupId, userId, limit, offset]);

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

    return {
      posts,
      totalCount: parseInt(countResult.rows[0].count)
    };
  }

  async getFeed(userId, limit = 20, offset = 0, search = '', type = 'all') {
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [userId]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    let whereClauseCount = '';
    let countParams = [];
    if (search) {
      whereClauseCount += ` AND (p.title ILIKE $${countParams.length + 1} OR p.content ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    if (type && type !== 'all') {
      whereClauseCount += ` AND p.type = $${countParams.length + 1}`;
      countParams.push(type);
    }

    const countResult = await db.query(`
      SELECT COUNT(*) FROM community_posts p
      WHERE 1=1 ${whereClauseCount}
    `, countParams);

    let whereClauseData = '';
    let searchVal = `%${search}%`;
    let dataParams = [userId, limit, offset];
    if (search) {
      whereClauseData += ` AND (p.title ILIKE $${dataParams.length + 1} OR p.content ILIKE $${dataParams.length + 1})`;
      dataParams.push(searchVal);
    }
    if (type && type !== 'all') {
      whereClauseData += ` AND p.type = $${dataParams.length + 1}`;
      dataParams.push(type);
    }

    const result = await db.query(`
      SELECT 
        p.*, u.name as author_name, u.role as author_role,
        u.trust_tier as author_trust_tier, u.trust_rank as author_trust_rank,
        u.reputation_points as author_reputation_points,
        iup.impact_score as author_reputation,
        iup.title as author_primary_field,
        COALESCE(v.vote_score, 0) as vote_score,
        COALESCE(c.comment_count, 0) as comment_count,
        uv.value as user_vote
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN invited_user_profiles iup ON u.id = iup.user_id
      LEFT JOIN (
        SELECT post_id, SUM(value) as vote_score FROM votes WHERE comment_id IS NULL GROUP BY post_id
      ) v ON v.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id
      ) c ON c.post_id = p.id
      LEFT JOIN votes uv ON uv.post_id = p.id AND uv.user_id = $1 AND uv.comment_id IS NULL
      WHERE 1=1 ${whereClauseData}
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, dataParams);

    let posts = result.rows.map(post => {
      const matchCount = post.tags ? post.tags.filter(tag => interests.includes(tag)).length : 0;
      let score = (parseInt(post.vote_score) || 0) + (matchCount * 10);
      // Surface quality knowledge via TrustRank: boost content from higher-credibility authors
      const trustRank = parseFloat(post.author_trust_rank) || 0; // 0..1 normalized PageRank
      score += Math.round(trustRank * 20);
      const isAuthority = post.author_trust_tier === 'professor' || post.author_role === 'invited_user';
      if (isAuthority) score += 5;
      return {
        ...post,
        discovery_score: score,
        reactions: {},
        user_reaction: null,
        discovery_reason: matchCount > 0
          ? `Matched your interest in "${post.tags.find(tag => interests.includes(tag))}"`
          : trustRank >= 0.7
            ? 'High-credibility contributor (TrustRank)'
            : isAuthority
              ? 'From a verified scholar in your field'
              : 'Trending in the community'
      };
    });

    return {
      posts,
      totalCount: parseInt(countResult.rows[0].count)
    };
  }

  async getPostById(postId, userId) {
    const result = await db.query(`
      SELECT 
        p.*, u.name as author_name, u.role as author_role,
        u.trust_tier as author_trust_tier, u.trust_rank as author_trust_rank,
        u.reputation_points as author_reputation_points,
        iup.impact_score as author_reputation,
        iup.title as author_primary_field,
        COALESCE(v.vote_score, 0) as vote_score,
        COALESCE(c.comment_count, 0) as comment_count,
        uv.value as user_vote
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN invited_user_profiles iup ON u.id = iup.user_id
      LEFT JOIN (
        SELECT post_id, SUM(value) as vote_score FROM votes WHERE comment_id IS NULL GROUP BY post_id
      ) v ON v.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id
      ) c ON c.post_id = p.id
      LEFT JOIN votes uv ON uv.post_id = p.id AND uv.user_id = $2 AND uv.comment_id IS NULL
      WHERE p.id = $1
    `, [postId, userId]);

    if (result.rows.length === 0) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const post = result.rows[0];
    
    // Process reactions
    const reactionResult = await db.query(
      `SELECT reaction_type, COUNT(*) as count, 
       MAX(CASE WHEN user_id = $2 THEN 1 ELSE 0 END) as user_reacted
       FROM post_reactions WHERE post_id = $1 GROUP BY reaction_type`,
      [postId, userId]
    );
    post.reactions = {};
    post.user_reaction = null;
    reactionResult.rows.forEach(r => {
      post.reactions[r.reaction_type] = parseInt(r.count);
      if (parseInt(r.user_reacted) === 1) post.user_reaction = r.reaction_type;
    });

    return post;
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

    // --- REPUTATION UPDATE LOGIC ---
    // If it's an upvote (value=1), reward the author. If it's a downvote or removal, handled accordingly.
    // For simplicity, we award 10 reputation points per net upvote change.
    const postRes = await db.query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
    const authorId = postRes.rows[0]?.user_id;
    if (authorId && authorId !== userId) {
      // Award 10 points for an upvote, subtract 10 for a downvote
      await reputationService.updateCommunityReputation(authorId, value * 10);
    }
    // -------------------------------

    eventBus.emitEvent('event.behaviour', { type: 'community.post.voted', userId, postId, value, timestamp: new Date().toISOString() });

    // Notify ML service immediately for real-time recommendation updates on upvote
    if (value === 1) {
      try {
        axios.post(`${ML_SERVICE_URL}/interactions`, {
          user_id: userId,
          item_id: `post_${postId}`,
          action: 'upvote'
        }).catch(err => logger.warn(`[ML] vote interaction signal failed: ${err.message}`));
      } catch (err) {
        logger.warn(`[ML] vote interaction sync failed: ${err.message}`);
      }
    }

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
        u.trust_tier as author_trust_tier, u.trust_rank as author_trust_rank,
        u.reputation_points as author_reputation_points,
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

  async addComment(userId, postId, content, parentId = null) {
    // Threaded replies: validate parent belongs to the same post
    if (parentId) {
      const parent = await db.query('SELECT id FROM comments WHERE id = $1 AND post_id = $2', [parentId, postId]);
      if (parent.rows.length === 0) {
        const e = new Error('Parent comment not found on this post');
        e.status = 400;
        throw e;
      }
    }

    const result = await db.query(
      'INSERT INTO comments (user_id, post_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, postId, sanitizeText(content), parentId]
    );

    const comment = result.rows[0];
    const userResult = await db.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    comment.author_name = userResult.rows[0].name;
    comment.author_role = userResult.rows[0].role;
    comment.vote_score = 0;
    comment.user_vote = null;

    eventBus.emitEvent('event.behaviour', { type: 'community.comment.created', userId, postId, commentId: comment.id, timestamp: new Date().toISOString() });

    // Notify ML service immediately for real-time recommendation updates
    try {
      axios.post(`${ML_SERVICE_URL}/interactions`, {
        user_id: userId,
        item_id: `post_${postId}`,
        action: 'comment'
      }).catch(err => logger.warn(`[ML] addComment interaction signal failed: ${err.message}`));
    } catch (err) {
      logger.warn(`[ML] addComment interaction sync failed: ${err.message}`);
    }

    // Notify the post author
    setImmediate(async () => {
      try {
        const postRes = await db.query('SELECT user_id, title FROM community_posts WHERE id = $1', [postId]);
        if (postRes.rows.length > 0) {
          const postAuthorId = postRes.rows[0].user_id;
          const postTitle = postRes.rows[0].title;
          
          if (parseInt(postAuthorId, 10) !== parseInt(userId, 10)) {
            const authorRes = await db.query('SELECT email FROM users WHERE id = $1', [postAuthorId]);
            const authorEmail = authorRes.rows[0]?.email;
            const commenterName = userResult.rows[0].name;
            const emailService = require('./email.service');
            const notificationService = require('./notification.service');
            const emailTpl = emailService.templates.forumReply(commenterName, postTitle);
            
            await notificationService.notify(
              parseInt(postAuthorId, 10),
              'forum_reply',
              `New reply on your post`,
              `${commenterName} replied to your post: "${postTitle}"`,
              { from_user_id: userId, post_id: postId, comment_id: comment.id },
              authorEmail,
              emailTpl
            );
          }
        }
      } catch (notifyErr) {
        logger.warn('[Community] Reply notification failed:', notifyErr.message);
      }
    });

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

  async createAMA(userId, data) {
    const { professor_id, title, description, scheduled_at, end_at } = data;

    const profRes = await db.query('SELECT role, name FROM users WHERE id = $1', [professor_id]);
    if (profRes.rows.length === 0) {
      const err = new Error('Professor user not found');
      err.statusCode = 404;
      throw err;
    }

    if (new Date(scheduled_at) >= new Date(end_at)) {
      const err = new Error('Scheduled start time must be before end time');
      err.statusCode = 400;
      throw err;
    }

    // 1. Create a community post for the AMA
    const postResult = await db.query(
      'INSERT INTO community_posts (user_id, type, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [professor_id, 'ama', `AMA: ${title}`, description]
    );
    const post = postResult.rows[0];

    // 2. Create the AMA session
    const amaResult = await db.query(
      'INSERT INTO ama_sessions (professor_id, post_id, title, description, scheduled_at, end_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [professor_id, post.id, title, description, scheduled_at, end_at]
    );
    const ama = amaResult.rows[0];

    eventBus.emitEvent('event.behaviour', { type: 'community.ama.created', userId, amaId: ama.id, timestamp: new Date().toISOString() });

    return {
      ...ama,
      post_id: post.id
    };
  }

  async getAMAs() {
    const result = await db.query(`
      SELECT a.*, u.name as professor_name, u.avatar_url as professor_avatar,
        p.view_count as post_views,
        COALESCE(c.comment_count, 0) as question_count
      FROM ama_sessions a
      JOIN users u ON a.professor_id = u.id
      LEFT JOIN community_posts p ON a.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id
      ) c ON c.post_id = a.post_id
      ORDER BY a.scheduled_at ASC
    `);
    return result.rows;
  }

  /**
   * Accept a comment as the answer to a question post (Module 5).
   * Only the post author may accept. Marks the comment is_accepted, records
   * accepted_comment_id on the post, and awards reputation to the answerer.
   */
  async acceptAnswer(userId, postId, commentId) {
    const post = await db.query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      const e = new Error('Post not found'); e.status = 404; throw e;
    }
    if (parseInt(post.rows[0].user_id, 10) !== parseInt(userId, 10)) {
      const e = new Error('Only the post author can accept an answer'); e.status = 403; throw e;
    }
    const comment = await db.query('SELECT id, user_id FROM comments WHERE id = $1 AND post_id = $2', [commentId, postId]);
    if (comment.rows.length === 0) {
      const e = new Error('Comment not found on this post'); e.status = 404; throw e;
    }

    await db.query('BEGIN');
    try {
      // Clear any previous accepted answer on this post, then set the new one
      await db.query('UPDATE comments SET is_accepted = FALSE WHERE post_id = $1', [postId]);
      await db.query('UPDATE comments SET is_accepted = TRUE WHERE id = $1', [commentId]);
      await db.query('UPDATE community_posts SET accepted_comment_id = $1 WHERE id = $2', [commentId, postId]);
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

    // Reward the answerer's reputation (fire-and-forget) + emit an endorsement signal for TrustRank
    const answererId = comment.rows[0].user_id;
    try {
      const reputationService = require('./reputation.service');
      await reputationService.award(answererId, 15, 'accepted_answer', 'comment', commentId);
    } catch (e) { logger.warn(`[acceptAnswer] reputation award failed: ${e.message}`); }
    eventBus.emitEvent('event.behaviour', {
      type: 'community.answer.accepted', userId, endorsedUserId: answererId, postId, commentId,
      timestamp: new Date().toISOString(),
    });

    return { postId, commentId, acceptedUserId: answererId };
  }
}

module.exports = new CommunityService();
