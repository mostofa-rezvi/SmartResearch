const express = require('express');
const router = express.Router();
const publicationsController = require('../controllers/publications.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// @route   POST /api/v1/publications/cite
// @desc    Generate a citation via LLM (BibTeX/APA/IEEE)
// @access  Private
router.post('/cite', verifyAuth, publicationsController.generateCitation);

// @route   POST /api/v1/publications/feedback
// @desc    Get structured writing feedback on an abstract via LLM
// @access  Private
router.post('/feedback', verifyAuth, publicationsController.getWritingFeedback);

// @route   GET /api/v1/publications/scimago
// @desc    Query local Scimago journal index by subject/keyword
// @access  Private
router.get('/scimago', verifyAuth, publicationsController.searchScimago);

// @route   GET /api/v1/publications/checklist
// @desc    Get publication readiness checklist template
// @access  Private
router.get('/checklist', verifyAuth, publicationsController.getChecklist);

module.exports = router;
