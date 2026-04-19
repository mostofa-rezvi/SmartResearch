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
}

module.exports = new UserController();
