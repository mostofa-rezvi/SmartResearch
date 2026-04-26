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
}

module.exports = new GroupService();
