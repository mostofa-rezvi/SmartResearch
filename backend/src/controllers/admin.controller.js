const adminService = require('../services/admin.service');
const { envelope } = require('../utils/responseEnvelope');

class AdminController {
  async invite(req, res, next) {
    try {
      const result = await adminService.invite(req.user.id, req.body);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
