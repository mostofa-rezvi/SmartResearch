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

    // New members start as 'pending'
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1, $2, $3, $4) ON CONFLICT (group_id, user_id) DO UPDATE SET status = EXCLUDED.status',
      [groupId, userId, 'member', 'pending']
    );

    eventBus.emitEvent('event.behaviour', { type: 'community.group.request_join', userId, groupId, timestamp: new Date().toISOString() });
    logger.info({ userId, groupId }, 'User requested to join group');

    return { message: 'Join request sent. Waiting for admin approval.' };
  }
  async getGroupById(groupId) {
    const result = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    return result.rows[0];
  }

  async checkMembership(userId, groupId) {
    const result = await db.query(
      'SELECT role, status FROM group_members WHERE user_id = $1 AND group_id = $2',
      [userId, groupId]
    );
    if (result.rows.length === 0) return { is_member: false, role: null, status: null };
    
    return { 
      is_member: result.rows[0].status === 'approved', 
      role: result.rows[0].role, 
      status: result.rows[0].status 
    };
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

  async getMembers(groupId, includePending = false) {
    const query = `
      SELECT 
        u.id, u.name, u.role as system_role, gm.role as group_role, gm.status,
        u.institution, u.researcher_type, u.research_interests
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1 ${includePending ? '' : "AND gm.status = 'approved'"}
       ORDER BY CASE gm.role 
         WHEN 'admin' THEN 1 
         WHEN 'contributor' THEN 2 
         ELSE 3 END, u.name ASC`;
    
    const result = await db.query(query, [groupId]);
    return result.rows;
  }

  async updateMemberRole(adminId, groupId, targetUserId, newRole) {
    // Verify requester is admin of the group
    const adminCheck = await db.query(
      'SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2 AND role = $3 AND status = $4',
      [adminId, groupId, 'admin', 'approved']
    );
    if (adminCheck.rows.length === 0) {
      const err = new Error('Only group admins can change member roles');
      err.statusCode = 403;
      throw err;
    }

    const result = await db.query(
      'UPDATE group_members SET role = $1 WHERE user_id = $2 AND group_id = $3 AND status = $4 RETURNING *',
      [newRole, targetUserId, groupId, 'approved']
    );
    
    if (result.rows.length === 0) {
      const err = new Error('Member not found in group or not approved');
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0];
  }

  async handleJoinRequest(adminId, groupId, targetUserId, action) {
    // Verify requester is admin of the group
    const adminCheck = await db.query(
      'SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2 AND role = $3 AND status = $4',
      [adminId, groupId, 'admin', 'approved']
    );
    if (adminCheck.rows.length === 0) {
      const err = new Error('Only group admins can manage join requests');
      err.statusCode = 403;
      throw err;
    }

    if (action === 'approve') {
      const result = await db.query(
        "UPDATE group_members SET status = 'approved' WHERE user_id = $1 AND group_id = $2 AND status = 'pending' RETURNING *",
        [targetUserId, groupId]
      );
      if (result.rows.length === 0) throw new Error('Request not found or already processed');
      
      eventBus.emitEvent('event.behaviour', { type: 'community.group.request_approved', adminId, userId: targetUserId, groupId, timestamp: new Date().toISOString() });
      return result.rows[0];
    } else if (action === 'reject') {
      const result = await db.query(
        "DELETE FROM group_members WHERE user_id = $1 AND group_id = $2 AND status = 'pending' RETURNING *",
        [targetUserId, groupId]
      );
      if (result.rows.length === 0) throw new Error('Request not found or already processed');
      
      eventBus.emitEvent('event.behaviour', { type: 'community.group.request_rejected', adminId, userId: targetUserId, groupId, timestamp: new Date().toISOString() });
      return { message: 'Request rejected' };
    } else {
      const err = new Error('Invalid action');
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = new GroupService();
