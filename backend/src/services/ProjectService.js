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
}

module.exports = new ProjectService();
