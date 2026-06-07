const db = require('../config/db');
const { getSession } = require('../config/neo4j');
const notificationService = require('../services/notification.service');
const { templates } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * POST /api/v1/connections/request
 * Send a connection request to another researcher.
 */
exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { recipient_id, message } = req.body;

    if (!recipient_id) {
      return res.status(400).json({ success: false, message: 'recipient_id is required' });
    }

    if (parseInt(recipient_id, 10) === requesterId) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });
    }

    // Check for existing connection (any status)
    const existing = await db.query(
      `SELECT id, status FROM connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)`,
      [requesterId, recipient_id]
    );

    if (existing.rows.length > 0) {
      const existingStatus = existing.rows[0].status;
      if (existingStatus === 'accepted') {
        return res.status(409).json({ success: false, message: 'Already connected' });
      }
      if (existingStatus === 'pending') {
        return res.status(409).json({ success: false, message: 'Connection request already pending' });
      }
    }

    // Create connection request
    const result = await db.query(
      `INSERT INTO connections (requester_id, recipient_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [requesterId, recipient_id, message || null]
    );
    const connection = result.rows[0];

    // Fetch recipient info for notification
    const recipientRes = await db.query('SELECT name, email FROM users WHERE id = $1', [recipient_id]);
    const requesterRes = await db.query('SELECT name FROM users WHERE id = $1', [requesterId]);

    if (recipientRes.rows.length > 0) {
      const recipient = recipientRes.rows[0];
      const requesterName = requesterRes.rows[0]?.name || 'A researcher';
      const emailTpl = templates.connectionRequest(requesterName);

      await notificationService.notify(
        parseInt(recipient_id, 10),
        'connection_request',
        `${requesterName} wants to connect`,
        `${requesterName} sent you a connection request on ResearchBridge.`,
        { from_user_id: requesterId, connection_id: connection.id },
        recipient.email,
        emailTpl
      );
    }

    res.status(201).json({ success: true, data: connection, message: 'Connection request sent' });
  } catch (err) {
    logger.error('[Connections] sendRequest error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/connections
 * List accepted connections for the current user.
 */
exports.listConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT
         c.id, c.created_at,
         CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END AS connected_user_id,
         CASE WHEN c.requester_id = $1 THEN u2.name ELSE u1.name END AS connected_user_name,
         CASE WHEN c.requester_id = $1 THEN u2.avatar_url ELSE u1.avatar_url END AS connected_user_avatar,
         CASE WHEN c.requester_id = $1 THEN u2.institution ELSE u1.institution END AS connected_user_institution
       FROM connections c
       JOIN users u1 ON c.requester_id = u1.id
       JOIN users u2 ON c.recipient_id = u2.id
       WHERE (c.requester_id = $1 OR c.recipient_id = $1) AND c.status = 'accepted'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('[Connections] listConnections error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/connections/pending
 * List pending incoming connection requests.
 */
exports.listPending = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT c.id, c.message, c.created_at, u.id as requester_id, u.name as requester_name, u.avatar_url as requester_avatar, u.institution as requester_institution
       FROM connections c
       JOIN users u ON c.requester_id = u.id
       WHERE c.recipient_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('[Connections] listPending error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/connections/:id/respond
 * Accept or reject a pending connection request.
 */
exports.respond = async (req, res) => {
  try {
    const recipientId = req.user.id;
    const connectionId = parseInt(req.params.id, 10);
    const { action } = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'accept' or 'reject'" });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const result = await db.query(
      `UPDATE connections SET status = $1, updated_at = NOW()
       WHERE id = $2 AND recipient_id = $3 AND status = 'pending'
       RETURNING *`,
      [newStatus, connectionId, recipientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Connection request not found or unauthorized' });
    }

    const connection = result.rows[0];

    // Sync to Neo4j on accept
    if (newStatus === 'accepted') {
      const session = getSession();
      try {
        await session.run(
          `MATCH (a:Researcher {userId: $uid1}), (b:Researcher {userId: $uid2})
           MERGE (a)-[:CONNECTED]->(b)
           MERGE (b)-[:CONNECTED]->(a)`,
          { uid1: connection.requester_id, uid2: recipientId }
        );
        logger.info(`[Connections] Neo4j CONNECTED edge synced: ${connection.requester_id} <-> ${recipientId}`);
      } catch (graphErr) {
        logger.warn('[Connections] Neo4j sync failed (non-fatal):', graphErr.message);
      } finally {
        await session.close();
      }

      // Notify the requester their request was accepted
      const requesterRes = await db.query('SELECT email FROM users WHERE id = $1', [connection.requester_id]);
      const recipientRes = await db.query('SELECT name FROM users WHERE id = $1', [recipientId]);
      if (requesterRes.rows.length > 0) {
        const recipientName = recipientRes.rows[0]?.name || 'A researcher';
        const emailTpl = templates.connectionAccepted(recipientName);
        await notificationService.notify(
          connection.requester_id,
          'connection_accepted',
          `${recipientName} accepted your connection`,
          `You are now connected with ${recipientName} on ResearchBridge.`,
          { from_user_id: recipientId, connection_id: connection.id },
          requesterRes.rows[0].email,
          emailTpl
        );
      }
    }

    res.status(200).json({ success: true, data: connection, message: `Connection ${newStatus}` });
  } catch (err) {
    logger.error('[Connections] respond error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/v1/connections/:id
 * Remove a connection.
 */
exports.remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = parseInt(req.params.id, 10);

    const result = await db.query(
      `DELETE FROM connections
       WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2)
       RETURNING *`,
      [connectionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    res.status(200).json({ success: true, message: 'Connection removed' });
  } catch (err) {
    logger.error('[Connections] remove error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/connections/status/:recipientId
 * Returns the connection status between the current user and the given user.
 * Used to determine button state in the UI.
 */
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipientId = parseInt(req.params.recipientId, 10);

    const result = await db.query(
      `SELECT id, status, requester_id FROM connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)
       LIMIT 1`,
      [userId, recipientId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: { status: 'none' } });
    }

    const conn = result.rows[0];
    res.status(200).json({
      success: true,
      data: {
        status: conn.status,
        connection_id: conn.id,
        i_am_requester: conn.requester_id === userId
      }
    });
  } catch (err) {
    logger.error('[Connections] getStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
