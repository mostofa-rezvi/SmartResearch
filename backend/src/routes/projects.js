const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { verifyAuth } = require('../middleware/auth.middleware');

// @route   POST /api/v1/projects
// @desc    Create a new project
router.post('/', verifyAuth, projectController.create);

// @route   GET /api/v1/projects/:id
// @desc    Get project details
router.get('/:id', verifyAuth, projectController.get);

// @route   POST /api/v1/projects/:id/invite
// @desc    Invite member to project
router.post('/:id/invite', verifyAuth, projectController.invite);

// @route   GET /api/v1/projects/:id/milestones
// @desc    List milestones in project
router.get('/:id/milestones', verifyAuth, projectController.listMilestones);

// @route   POST /api/v1/projects/:id/milestones
// @desc    Create milestone in project
router.post('/:id/milestones', verifyAuth, projectController.createMilestone);

// @route   PATCH /api/v1/projects/milestones/:milestoneId/status
// @desc    Update milestone status
router.patch('/milestones/:milestoneId/status', verifyAuth, projectController.updateMilestone);

module.exports = router;
