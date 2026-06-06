const db = require('../config/db');
const logger = require('../utils/logger');

const VALID_TRANSITIONS = {
  'TODO': ['IN_PROGRESS'],
  'IN_PROGRESS': ['TODO', 'REVIEW'],
  'REVIEW': ['IN_PROGRESS', 'DONE'],
  'DONE': ['REVIEW'] // Need strong reason/admin to revert
};

class MilestoneService {
  async createMilestone(projectId, userId, title, description) {
    const res = await db.query(
      'INSERT INTO milestones (project_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [projectId, title, description]
    );
    return res.rows[0];
  }

  async listMilestones(projectId) {
    const res = await db.query(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY id ASC',
      [projectId]
    );
    return res.rows;
  }

  async updateStatus(milestoneId, userId, newStatus) {
    // 1. Get current status and project context
    const milestoneRes = await db.query(
      'SELECT status, project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );
    if (milestoneRes.rowCount === 0) throw new Error('Milestone not found');
    
    const { status: currentStatus, project_id: projectId } = milestoneRes.rows[0];

    // 2. State Machine Validation
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    // 3. RBAC checks (e.g., only Admin can move to DONE)
    if (newStatus === 'DONE') {
      const authCheck = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      if (authCheck.rows[0]?.role !== 'admin') {
        throw new Error('Only admins can mark a milestone as DONE');
      }
    }

    // 4. Update
    const updateRes = await db.query(
      'UPDATE milestones SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStatus, milestoneId]
    );
    return updateRes.rows[0];
  }
}

module.exports = new MilestoneService();
