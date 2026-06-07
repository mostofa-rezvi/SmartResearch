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

// ── Collaborative Document Version Snapshot Endpoints ────────────────────────
// @route   POST /api/v1/projects/:id/versions
// @desc    Create a version snapshot of the project document
router.post('/:id/versions', verifyAuth, projectController.createVersion);

// @route   GET /api/v1/projects/:id/versions
// @desc    List all version snapshots of the project document
router.get('/:id/versions', verifyAuth, projectController.listVersions);

// @route   POST /api/v1/projects/:id/versions/:versionId/revert
// @desc    Revert the project document to a specific version snapshot
router.post('/:id/versions/:versionId/revert', verifyAuth, projectController.revertVersion);

// ── Peer Review System Endpoints ────────────────────────
// @route   POST /api/v1/projects/:id/reviews/request
// @desc    Request a peer review for a project
router.post('/:id/reviews/request', verifyAuth, projectController.requestReview);

// @route   PATCH /api/v1/projects/reviews/:reviewId/status
// @desc    Accept or decline a peer review request
router.patch('/reviews/:reviewId/status', verifyAuth, projectController.respondToReviewRequest);

// @route   POST /api/v1/projects/reviews/:reviewId/submit
// @desc    Submit peer review content
router.post('/reviews/:reviewId/submit', verifyAuth, projectController.submitReview);

module.exports = router;
