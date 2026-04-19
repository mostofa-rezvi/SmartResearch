const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { envelope } = require('../utils/responseEnvelope');

// @route   POST /api/v1/groups
// @desc    Create a new research group
router.post('/', auth, async (req, res) => {
  const { name, description, focus_area, type } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO groups (name, description, focus_area, type, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, focus_area, type || 'public', req.user.id]
    );

    const group = result.rows[0];

    // Creator becomes Group Admin
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.id, req.user.id, 'admin']
    );

    res.json(envelope(group));
  } catch (err) {
    console.error(err.message);
    res.status(500).json(envelope(null, { error: err.message }));
  }
});

// @route   GET /api/v1/groups
// @desc    Get all public groups
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM groups WHERE type = $1 ORDER BY created_at DESC', ['public']);
    res.json(envelope(result.rows));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

// @route   POST /api/v1/groups/:id/join
// @desc    Join a public group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [req.params.id]);
    if (groupResult.rows.length === 0) return res.status(404).json(envelope(null, { error: 'Group not found' }));

    const group = groupResult.rows[0];
    if (group.type === 'private') return res.status(403).json(envelope(null, { error: 'Cannot join private group without invitation' }));

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [group.id, req.user.id, 'member']
    );

    res.json(envelope({ message: 'Joined group successfully' }));
  } catch (err) {
    res.status(500).json(envelope(null, { error: 'Server error' }));
  }
});

module.exports = router;
