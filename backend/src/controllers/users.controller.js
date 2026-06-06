const userService = require('../services/users.service');
const { envelope } = require('../utils/responseEnvelope');

class UserController {
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.params.id);
      res.json(envelope(profile));
    } catch (err) {
      next(err);
    }
  }

  async getReadingHistory(req, res, next) {
    try {
      const history = await userService.getReadingHistory(req.user.id);
      res.json(envelope(history));
    } catch (err) {
      next(err);
    }
  }

  async recordReadingHistory(req, res, next) {
    try {
      const historyRecord = await userService.recordReadingHistory(req.user.id, req.body);
      res.status(201).json(envelope(historyRecord));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();

