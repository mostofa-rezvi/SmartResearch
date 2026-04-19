const express = require('express');
const router = express.Router();
const ReputationController = require('../controllers/reputation.controller');
const { auth, requireRole } = require('../middleware/auth');

// @route   POST /api/reputation/calculate/:userId?
// @desc    Calculate and assign a new reputation impact score
// @access  Protected (Admins only for target users, or Self if no userId)
router.post('/calculate/:userId', [auth, requireRole(['super_admin', 'admin'])], ReputationController.calculateImpact);
router.post('/calculate', [auth], ReputationController.calculateImpact);

module.exports = router;
