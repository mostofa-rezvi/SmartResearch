const db = require('../config/db');
const logger = require('../utils/logger');

class ProjectService {
  async createProject(userId, projectData) {
    const { name, description } = projectData;
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create project
      const projectRes = await client.query(
        'INSERT INTO projects (name, description, creator_id) VALUES ($1, $2, $3) RETURNING id, name',
        [name, description, userId]
      );
      const projectId = projectRes.rows[0].id;

      // 2. Add creator as Admin
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, userId, 'admin']
      );

      // 3. Create a default Collaborative Doc
      await client.query(
        'INSERT INTO collaborative_docs (project_id, title) VALUES ($1, $2)',
        [projectId, 'Main Research Doc']
      );

      await client.query('COMMIT');
      return projectRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /** List every project the user is a member of (for the workspace project selector). */
  async listUserProjects(userId) {
    const result = await db.query(`
      SELECT p.id, p.name, p.description, p.status, p.created_at, pm.role,
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC
    `, [userId]);
    return result.rows;
  }

  async getProject(projectId, userId) {
    // Basic authorization check
    const authCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (authCheck.rowCount === 0) throw new Error('Unauthorized');

    // Fetch details
    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    const membersRes = await db.query(`
      SELECT u.id, u.name, pm.role 
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [projectId]);
    
    return {
      ...projectRes.rows[0],
      members: membersRes.rows
    };
  }

  async inviteMember(projectId, adminId, targetUserId, role = 'member') {
    // Validate Admin
    const adminCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, adminId]
    );
    if (adminCheck.rowCount === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Only admins can invite members');
    }

    // Add member
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [projectId, targetUserId, role]
    );
    return { success: true };
  }

  async requestReview(projectId, requesterId, reviewerId) {
    // 1. Authorization check for requester: must be member of project
    const authCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, requesterId]
    );
    if (authCheck.rowCount === 0) throw new Error('Unauthorized');

    // 2. Validate reviewer exists
    const reviewerCheck = await db.query('SELECT name FROM users WHERE id = $1', [reviewerId]);
    if (reviewerCheck.rowCount === 0) throw new Error('Reviewer not found');

    // 3. Create review request
    const res = await db.query(
      'INSERT INTO peer_reviews (project_id, requester_id, reviewer_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, requesterId, reviewerId, 'requested']
    );
    return res.rows[0];
  }

  async respondToReviewRequest(reviewId, reviewerId, status) {
    // 1. Verify review request exists
    const reviewCheck = await db.query('SELECT * FROM peer_reviews WHERE id = $1', [reviewId]);
    if (reviewCheck.rowCount === 0) throw new Error('Review request not found');

    // 2. Authorization check: must be the assigned reviewer
    if (reviewCheck.rows[0].reviewer_id !== reviewerId) throw new Error('Unauthorized');

    // 3. Update status
    const res = await db.query(
      'UPDATE peer_reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, reviewId]
    );
    return res.rows[0];
  }

  async submitReview(reviewId, reviewerId, reviewContent) {
    // 1. Verify review request exists
    const reviewCheck = await db.query('SELECT * FROM peer_reviews WHERE id = $1', [reviewId]);
    if (reviewCheck.rowCount === 0) throw new Error('Review request not found');

    // 2. Authorization check: must be the assigned reviewer
    if (reviewCheck.rows[0].reviewer_id !== reviewerId) throw new Error('Unauthorized');

    // 3. Check status is 'accepted'
    if (reviewCheck.rows[0].status !== 'accepted') {
      throw new Error('Review request has not been accepted');
    }

    // 4. Submit review content and mark complete
    const res = await db.query(
      'UPDATE peer_reviews SET review_content = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [reviewContent, 'completed', reviewId]
    );
    return res.rows[0];
  }
}

module.exports = new ProjectService();
