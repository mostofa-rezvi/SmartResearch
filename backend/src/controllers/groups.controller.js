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
}

module.exports = new GroupController();
