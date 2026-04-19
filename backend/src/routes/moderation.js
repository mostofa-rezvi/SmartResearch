const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { envelope } = require('../utils/responseEnvelope');

// Helper to log audit actions
const logAudit = async (adminId, action, targetType, targetId, details) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [adminId, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch(err) {
    console.error('Audit log failed', err);
  }
};

// @route   GET /api/v1/moderation/queue
// @desc    Get flagged content and pending journals
router.get('/queue', [auth, requireRole(['super_admin', 'admin'])], async (req, res) => {
  try {
    const flagsResult = await db.query(`
      SELECT f.*, p.title as post_title, p.content as post_content, 
             u.name as reporter_name
      FROM content_flags f
      JOIN community_posts p ON f.post_id = p.id
      LEFT JOIN users u ON f.reporter_id = u.id
      WHERE f.status = 'pending'
      ORDER BY f.created_at DESC
    `);

    const journalsResult = await db.query(`
      SELECT * FROM journals WHERE status = 'pending' ORDER BY created_at DESC
    `);

    res.json(envelope({
      flags: flagsResult.rows,
      journals: journalsResult.rows
    }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   POST /api/v1/moderation/resolve_flag/:id
// @desc    Resolve a flagged community post
router.post('/resolve_flag/:id', [auth, requireRole(['super_admin', 'admin'])], async (req, res) => {
  const { action, reason } = req.body;
  try {
    const flagRes = await db.query('SELECT * FROM content_flags WHERE id = $1', [req.params.id]);
    if (flagRes.rows.length === 0) return res.status(404).json(envelope(null, { error: 'Flag not found' }));
    
    const flag = flagRes.rows[0];

    if (action === 'delete_post') {
      await db.query('DELETE FROM community_posts WHERE id = $1', [flag.post_id]);
      await db.query('UPDATE content_flags SET status = $1 WHERE post_id = $2', ['resolved', flag.post_id]);
    } else {
      await db.query('UPDATE content_flags SET status = $1 WHERE id = $2', ['dismissed', flag.id]);
    }

    await logAudit(req.user.id, action, 'community_post', flag.post_id, { reason });
    res.json(envelope({ message: 'Flag resolved' }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   POST /api/v1/moderation/journals/:id/status
// @desc    Approve or reject a pending journal
router.post('/journals/:id/status', [auth, requireRole(['super_admin', 'admin'])], async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE journals SET status = $1 WHERE id = $2', [status, req.params.id]);
    await logAudit(req.user.id, `journal_status_update`, 'journal', req.params.id, { new_status: status });
    res.json(envelope({ message: `Journal ${status}` }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/moderation/audit_logs
// @desc    Get system audit logs
router.get('/audit_logs', [auth, requireRole(['super_admin', 'admin'])], async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, u.name as admin_name 
      FROM audit_logs l 
      JOIN users u ON l.admin_id = u.id 
      ORDER BY l.created_at DESC LIMIT 100
    `);
    res.json(envelope(result.rows));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   GET /api/v1/moderation/stats
// @desc    Get dashboard hierarchy and activity stats
router.get('/stats', [auth, requireRole(['super_admin', 'admin'])], async (req, res) => {
  try {
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const flagCount = await db.query("SELECT COUNT(*) FROM content_flags WHERE status = 'pending'");
    const hubStats = await db.query('SELECT geography, COUNT(*) as count FROM journals GROUP BY geography LIMIT 5');

    res.json(envelope({
      totalUsers: userCount.rows[0].count,
      pendingFlags: flagCount.rows[0].count,
      activeHubs: hubStats.rows
    }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
