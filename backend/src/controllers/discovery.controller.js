const discoveryService = require('../services/discovery.service');
const { envelope } = require('../utils/responseEnvelope');

class DiscoveryController {
  async search(req, res, next) {
    try {
      const { query, domain, institution, skills } = req.query;
      const filters = { domain, institution, skills: skills ? skills.split(',') : null };
      const results = await discoveryService.search(req.user.id, query, filters);
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

  async getSuggestedCollaborators(req, res, next) {
    try {
      const results = await discoveryService.getSuggestedCollaborators(req.user.id);
      res.json(envelope(results));
    } catch (err) {
      next(err);
    }
  }

  async getRecommendations(req, res, next) {
    try {
      const results = await discoveryService.getRecommendationsFromOnboarding(req.user.id);
      res.json(envelope(results));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DiscoveryController();
