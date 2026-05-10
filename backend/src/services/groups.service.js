const db = require('../config/db');
const eventBus = require('./eventBus.service');
const logger = require('../utils/logger');

class GroupService {
  async createGroup(userId, groupData) {
    const { name, description, focus_area, type } = groupData;

    const result = await db.query(
      'INSERT INTO groups (name, description, focus_area, type, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, focus_area, type, userId]
    );

    const group = result.rows[0];

    // Creator becomes Group Admin
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.id, userId, 'admin']
    );

    eventBus.emitEvent('event.behaviour', { type: 'community.group.created', userId, groupId: group.id, timestamp: new Date().toISOString() });
    logger.info({ userId, groupId: group.id }, 'New research group created');

    return group;
  }

  async listPublicGroups() {
    const result = await db.query('SELECT * FROM groups WHERE type = $1 ORDER BY created_at DESC', ['public']);
    return result.rows;
  }

  async joinGroup(userId, groupId) {
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      const err = new Error('Group not found');
      err.statusCode = 404;
      throw err;
    }

    const group = groupResult.rows[0];
    if (group.type === 'private') {
      const err = new Error('Cannot join private group without invitation');
      err.statusCode = 403;
      throw err;
    }

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [groupId, userId, 'member']
    );

    eventBus.emitEvent('event.behaviour', { type: 'community.group.joined', userId, groupId, timestamp: new Date().toISOString() });
    logger.info({ userId, groupId }, 'User joined group');

    return { message: 'Joined group successfully' };
  }
  async getGroupById(groupId) {
    const result = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    return result.rows[0];
  }

  async checkMembership(userId, groupId) {
    const result = await db.query(
      'SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2',
      [userId, groupId]
    );
    return { is_member: result.rows.length > 0, role: result.rows[0]?.role || null };
  }

  async leaveGroup(userId, groupId) {
    await db.query(
      'DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 AND role != $3',
      [userId, groupId, 'admin'] // Prevent admins from leaving via this route for safety
    );
    eventBus.emitEvent('event.behaviour', { type: 'community.group.left', userId, groupId, timestamp: new Date().toISOString() });
    logger.info({ userId, groupId }, 'User left group');
    return { message: 'Left group successfully' };
  }

  async getMembers(groupId) {
    const result = await db.query(
      `SELECT 
        u.id, u.name, u.role as system_role, gm.role as group_role, 
        u.institution, u.researcher_type, u.research_interests
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY CASE gm.role 
         WHEN 'admin' THEN 1 
         WHEN 'contributor' THEN 2 
         ELSE 3 END, u.name ASC`,
      [groupId]
    );
    return result.rows;
  }

  async updateMemberRole(adminId, groupId, targetUserId, newRole) {
    // Verify requester is admin of the group
    const adminCheck = await db.query(
      'SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2 AND role = $3',
      [adminId, groupId, 'admin']
    );
    if (adminCheck.rows.length === 0) {
      const err = new Error('Only group admins can change member roles');
      err.statusCode = 403;
      throw err;
    }

    const result = await db.query(
      'UPDATE group_members SET role = $1 WHERE user_id = $2 AND group_id = $3 RETURNING *',
      [newRole, targetUserId, groupId]
    );
    
    if (result.rows.length === 0) {
      const err = new Error('Member not found in group');
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0];
  }
}

module.exports = new GroupService();
