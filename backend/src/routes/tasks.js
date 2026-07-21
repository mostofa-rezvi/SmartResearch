const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const VALID_STATUS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

/**
 * Tasks API (Module 3) — CRUD over the `tasks` table (task belongs to a milestone
 * → project). Access is limited to members of the owning project.
 */

// helper: is the user a member of the project that owns this milestone?
async function assertMilestoneAccess(milestoneId, userId) {
  const r = await db.query(
    `SELECT m.id, m.project_id
       FROM milestones m
       JOIN project_members pm ON pm.project_id = m.project_id
      WHERE m.id = $1 AND pm.user_id = $2`,
    [milestoneId, userId]
  );
  return r.rows[0] || null;
}

// GET /api/v1/tasks?milestone_id=  — list tasks for a milestone
router.get('/', auth, async (req, res) => {
  try {
    const { milestone_id } = req.query;
    if (!milestone_id) return res.status(400).json({ success: false, message: 'milestone_id is required' });
    const access = await assertMilestoneAccess(milestone_id, req.user.id);
    if (!access) return res.status(403).json({ success: false, message: 'Not a member of this project' });
    const { rows } = await db.query(
      `SELECT t.*, u.name AS assignee_name
         FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.milestone_id = $1 ORDER BY t.created_at ASC`,
      [milestone_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`[Tasks] list failed: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/v1/tasks  — create a task on a milestone
router.post('/', auth, async (req, res) => {
  try {
    const { milestone_id, title, assignee_id, status } = req.body;
    if (!milestone_id || !title) return res.status(400).json({ success: false, message: 'milestone_id and title are required' });
    const st = VALID_STATUS.includes(status) ? status : 'TODO';
    const access = await assertMilestoneAccess(milestone_id, req.user.id);
    if (!access) return res.status(403).json({ success: false, message: 'Not a member of this project' });
    const { rows } = await db.query(
      `INSERT INTO tasks (milestone_id, title, assignee_id, status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [milestone_id, title, assignee_id || null, st]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error(`[Tasks] create failed: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/v1/tasks/:id  — update status/title/assignee
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, title, assignee_id } = req.body;
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of ${VALID_STATUS.join(', ')}` });
    }
    // membership check via the task's milestone
    const own = await db.query(
      `SELECT t.id FROM tasks t
         JOIN milestones m ON t.milestone_id = m.id
         JOIN project_members pm ON pm.project_id = m.project_id
        WHERE t.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (own.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found or no access' });

    const sets = [];
    const params = [];
    if (status !== undefined) { params.push(status); sets.push(`status = $${params.length}`); }
    if (title !== undefined) { params.push(title); sets.push(`title = $${params.length}`); }
    if (assignee_id !== undefined) { params.push(assignee_id); sets.push(`assignee_id = $${params.length}`); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    sets.push('updated_at = NOW()');
    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error(`[Tasks] update failed: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const own = await db.query(
      `SELECT t.id FROM tasks t
         JOIN milestones m ON t.milestone_id = m.id
         JOIN project_members pm ON pm.project_id = m.project_id
        WHERE t.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (own.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found or no access' });
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    logger.error(`[Tasks] delete failed: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
