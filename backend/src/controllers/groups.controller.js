const groupsService = require('../services/groups.service');
const { envelope } = require('../utils/responseEnvelope');

class GroupController {
  async create(req, res, next) {
    try {
      const group = await groupsService.createGroup(req.user.id, req.body);
      res.status(201).json(envelope(group));
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const groups = await groupsService.listPublicGroups();
      res.json(envelope(groups));
    } catch (err) {
      next(err);
    }
  }

  async join(req, res, next) {
    try {
      const result = await groupsService.joinGroup(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
  async get(req, res, next) {
    try {
      const group = await groupsService.getGroupById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      res.json(envelope(group));
    } catch (err) {
      next(err);
    }
  }

  async leave(req, res, next) {
    try {
      const result = await groupsService.leaveGroup(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async getMembership(req, res, next) {
    try {
      const result = await groupsService.checkMembership(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req, res, next) {
    try {
      const members = await groupsService.getMembers(req.params.id);
      res.json(envelope(members));
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const result = await groupsService.updateMemberRole(
        req.user.id, 
        req.params.id, 
        req.params.userId, 
        req.body.role
      );
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GroupController();
