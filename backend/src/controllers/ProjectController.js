const projectService = require('../services/ProjectService');
const milestoneService = require('../services/MilestoneService');
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
}

module.exports = new ProjectController();
