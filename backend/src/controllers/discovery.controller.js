const discoveryService = require('../services/discovery.service');
const { envelope } = require('../utils/responseEnvelope');

class DiscoveryController {
  async search(req, res, next) {
    try {
      const results = await discoveryService.search(req.user.id, req.query.query);
      res.json(envelope(results));
    } catch (err) {
      next(err);
    }
  }

  async save(req, res, next) {
    try {
      const result = await discoveryService.savePaper(req.user.id, req.body);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DiscoveryController();
