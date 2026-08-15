const express = require('express');
const router = express.Router();
const collaborationsController = require('../controllers/collaborations.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// All collaboration routes require authentication
router.use(verifyAuth);

// @route   POST /api/v1/collaborations/request
// @desc    Send a research collaboration proposal to a recommended researcher
// @access  Private
router.post('/request', collaborationsController.sendRequest);

// @route   GET /api/v1/collaborations
// @desc    List collaboration requests involving the current user (sent + received)
// @access  Private
router.get('/', collaborationsController.listMine);

// @route   GET /api/v1/collaborations/pending
// @desc    List incoming pending collaboration proposals
// @access  Private
router.get('/pending', collaborationsController.listPending);

// @route   POST /api/v1/collaborations/:id/respond
// @desc    Accept (auto-creates the team) or decline a proposal
// @access  Private
router.post('/:id/respond', collaborationsController.respond);

module.exports = router;
