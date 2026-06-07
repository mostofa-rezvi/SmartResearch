const communityService = require('../services/community.service');
const storageService = require('../services/storage.service');
const { envelope } = require('../utils/responseEnvelope');

class CommunityController {
  async createPost(req, res, next) {
    try {
      const post = await communityService.createPost(req.user.id, req.body);
      res.status(201).json(envelope(post));
    } catch (err) {
      next(err);
    }
  }

  async getGroupFeed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const result = await communityService.getGroupFeed(req.params.groupId, req.user.id, limit, offset);
      res.json(envelope(result.posts, { totalCount: result.totalCount, limit, offset }));
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      const type = req.query.type || 'all';
      
      const result = await communityService.getFeed(req.user.id, limit, offset, search, type);
      res.json(envelope(result.posts, { totalCount: result.totalCount, limit, offset }));
    } catch (err) {
      next(err);
    }
  }

  async getPostById(req, res, next) {
    try {
      const post = await communityService.getPostById(req.params.id, req.user.id);
      res.json(envelope(post));
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

  async react(req, res, next) {
    try {
      const result = await communityService.react(req.user.id, req.params.id, req.body.reaction_type);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async getComments(req, res, next) {
    try {
      const comments = await communityService.getComments(req.params.id, req.user.id);
      res.json(envelope(comments));
    } catch (err) {
      next(err);
    }
  }

  async addComment(req, res, next) {
    try {
      const comment = await communityService.addComment(req.user.id, req.params.id, req.body.content);
      res.status(201).json(envelope(comment));
    } catch (err) {
      next(err);
    }
  }

  async sharePost(req, res, next) {
    try {
      const result = await communityService.sharePost(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req, res, next) {
    try {
      const result = await communityService.deletePost(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async updatePost(req, res, next) {
    try {
      const result = await communityService.updatePost(req.user.id, req.params.id, req.body);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const result = await communityService.deleteComment(req.user.id, req.params.id);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async updateComment(req, res, next) {
    try {
      const result = await communityService.updateComment(req.user.id, req.params.id, req.body.content);
      res.json(envelope(result));
    } catch (err) {
      next(err);
    }
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        const err = new Error('No image provided');
        err.statusCode = 400;
        throw err;
      }

      const imageUrl = await storageService.uploadFile(req.file, 'community');
      res.json(envelope({ url: imageUrl }));
    } catch (err) {
      next(err);
    }
  }
  async createAMA(req, res, next) {
    try {
      const ama = await communityService.createAMA(req.user.id, req.body);
      res.status(201).json(envelope(ama));
    } catch (err) {
      next(err);
    }
  }

  async getAMAs(req, res, next) {
    try {
      const amas = await communityService.getAMAs();
      res.json(envelope(amas));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommunityController();
