const projectService = require('../services/ProjectService');
const milestoneService = require('../services/MilestoneService');
const collaborationService = require('../services/CollaborationService');
const { envelope, errorEnvelope } = require('../utils/responseEnvelope');

class ProjectController {
  async create(req, res, next) {
    try {
      const project = await projectService.createProject(req.user.id, req.body);
      res.status(201).json(envelope(project));
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const project = await projectService.getProject(req.params.id, req.user.id);
      res.json(envelope(project));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async invite(req, res, next) {
    try {
      const result = await projectService.inviteMember(req.params.id, req.user.id, req.body.targetUserId, req.body.role);
      res.json(envelope(result));
    } catch (err) {
      if (err.message.includes('Only admins')) return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async updateMilestone(req, res, next) {
    try {
      const result = await milestoneService.updateStatus(req.params.milestoneId, req.user.id, req.body.status);
      res.json(envelope(result));
    } catch (err) {
      if (err.message.includes('Only admins') || err.message.includes('Invalid transition')) {
        return res.status(400).json(errorEnvelope(err.message, 400));
      }
      next(err);
    }
  }

  async createMilestone(req, res, next) {
    try {
      const milestone = await milestoneService.createMilestone(
        req.params.id,
        req.user.id,
        req.body.title,
        req.body.description
      );
      res.status(201).json(envelope(milestone));
    } catch (err) {
      next(err);
    }
  }

  async listMilestones(req, res, next) {
    try {
      const milestones = await milestoneService.listMilestones(req.params.id);
      res.json(envelope(milestones));
    } catch (err) {
      next(err);
    }
  }

  async createVersion(req, res, next) {
    try {
      const projectId = req.params.id;
      const userId = req.user.id;
      const { versionName } = req.body;

      if (!versionName) {
        const err = new Error('versionName is required');
        err.statusCode = 400;
        throw err;
      }

      // Verify user is member of project (throws Unauthorized if not)
      await projectService.getProject(projectId, userId);

      const snapshot = await collaborationService.createVersionSnapshot(projectId, userId, versionName);
      res.status(201).json(envelope(snapshot));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async listVersions(req, res, next) {
    try {
      const projectId = req.params.id;
      const userId = req.user.id;

      // Verify membership
      await projectService.getProject(projectId, userId);

      const versions = await collaborationService.listVersions(projectId);
      res.json(envelope(versions));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async revertVersion(req, res, next) {
    try {
      const projectId = req.params.id;
      const versionId = req.params.versionId;
      const userId = req.user.id;

      // Verify membership
      await projectService.getProject(projectId, userId);

      const revertedBinary = await collaborationService.revertToVersion(projectId, versionId);

      // Broadcast Socket.IO event to let all collaborators know document has been reverted
      const room = `project_${projectId}`;
      if (req.io) {
        req.io.to(room).emit('sync:reverted', { versionId, binary: revertedBinary });
      }

      res.json(envelope({ message: 'Document successfully reverted', versionId }));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async requestReview(req, res, next) {
    try {
      const { reviewer_id } = req.body;
      if (!reviewer_id) {
        return res.status(400).json(errorEnvelope('reviewer_id is required', 400));
      }
      const review = await projectService.requestReview(req.params.id, req.user.id, reviewer_id);
      res.status(201).json(envelope(review));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async respondToReviewRequest(req, res, next) {
    try {
      const { status } = req.body;
      if (!status || !['accepted', 'declined'].includes(status)) {
        return res.status(400).json(errorEnvelope('status must be accepted or declined', 400));
      }
      const review = await projectService.respondToReviewRequest(req.params.reviewId, req.user.id, status);
      res.json(envelope(review));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }

  async submitReview(req, res, next) {
    try {
      const { review_content } = req.body;
      if (!review_content) {
        return res.status(400).json(errorEnvelope('review_content is required', 400));
      }
      const review = await projectService.submitReview(req.params.reviewId, req.user.id, review_content);
      res.json(envelope(review));
    } catch (err) {
      if (err.message === 'Unauthorized') return res.status(403).json(errorEnvelope(err.message, 403));
      next(err);
    }
  }
}

module.exports = new ProjectController();
