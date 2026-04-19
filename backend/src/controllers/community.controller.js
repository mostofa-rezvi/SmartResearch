const communityService = require('../services/community.service');
const { envelope } = require('../utils/responseEnvelope');

class CommunityController {
  async createPost(req, res, next) {
    try {
      const post = await communityService.createPost(req.user.id, req.body, req.io);
      res.status(201).json(envelope(post));
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req, res, next) {
    try {
      const posts = await communityService.getFeed(req.user.id);
      res.json(envelope(posts));
    } catch (err) {
      next(err);
    }
  }

  async vote(req, res, next) {
    try {
      const result = await communityService.vote(req.user.id, req.params.id, req.body.value);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommunityController();
