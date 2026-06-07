const db = require('../config/db');
const logger = require('../utils/logger');
const { sendMail } = require('./email.service');
const eventBus = require('./eventBus.service');

/**
 * Central Notification Service
 * Handles persistent DB storage + live Socket.IO delivery + async email delivery.
 *
 * Usage:
 *   const notificationService = require('./notification.service');
 *   await notificationService.notify(userId, 'connection_request', 'New connection', 'John wants to connect', { from_user_id: 42 });
 */

let _io = null; // Socket.IO server instance — injected at startup

/**
 * Inject the Socket.IO server instance (called from index.js after io is created).
 * @param {import('socket.io').Server} io
 */
const init = (io) => {
  _io = io;
};

/**
 * Create and deliver a notification to a user by queuing it via Redis Streams.
 *
 * @param {number} userId          — Target user's DB id
 * @param {string} type            — Notification type key (e.g. 'connection_request')
 * @param {string} title           — Short notification title
 * @param {string} [body]          — Optional longer body text
 * @param {object} [meta]          — Optional metadata (from_user_id, post_id, etc.)
 * @param {string} [recipientEmail] — If provided, sends an email too
 * @param {object} [emailTemplate] — Email template object containing subject and html strings
 */
const notify = async (userId, type, title, body = null, meta = {}, recipientEmail = null, emailTemplate = null) => {
  try {
    await eventBus.emitEvent('notification.events', {
      userId,
      type,
      title,
      body,
      meta,
      recipientEmail,
      emailTemplate
    });
    logger.info(`[NOTIFY] Enqueued notification event for user ${userId}: ${type}`);
  } catch (err) {
    logger.error(`[NOTIFY] Failed to enqueue notification for user ${userId}:`, err);
  }
};

/**
 * Process a notification event from the queue.
 * Performs database persistence, Socket.IO live delivery, and email dispatch.
 * Called by the notification worker.
 */
const processNotify = async (payload) => {
  const { userId, type, title, body, meta, recipientEmail, emailTemplate } = payload;
  try {
    // 1. Persist to DB
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, meta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, body, typeof meta === 'string' ? meta : JSON.stringify(meta || {})]
    );
    const notification = result.rows[0];

    // 2. Live delivery via Socket.IO
    if (_io) {
      _io.to(`user_${userId}`).emit('notification:new', notification);
      logger.info(`[NOTIFY WORKER] Delivered live notification to user_${userId}: ${type}`);
    } else {
      logger.warn(`[NOTIFY WORKER] Socket.IO instance (_io) not initialized yet`);
    }

    // 3. Email delivery
    if (recipientEmail && emailTemplate) {
      try {
        await sendMail(recipientEmail, emailTemplate.subject, emailTemplate.html);
      } catch (emailErr) {
        logger.warn(`[NOTIFY WORKER] Email failed for user ${userId}: ${emailErr.message}`);
      }
    }

    return notification;
  } catch (err) {
    logger.error(`[NOTIFY WORKER] Failed to process notification for user ${userId}:`, err);
    throw err;
  }
};

/**
 * Get notifications for a user (paginated).
 * @param {number} userId
 * @param {number} limit
 * @param {number} offset
 */
const getForUser = async (userId, limit = 20, offset = 0) => {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

/**
 * Count unread notifications for a user.
 * @param {number} userId
 */
const countUnread = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Mark specific notification(s) as read.
 * @param {number} notificationId
 * @param {number} userId — For ownership check
 */
const markRead = async (notificationId, userId) => {
  await db.query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};

/**
 * Mark ALL notifications as read for a user.
 * @param {number} userId
 */
const markAllRead = async (userId) => {
  await db.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
};

module.exports = { init, notify, processNotify, getForUser, countUnread, markRead, markAllRead };
