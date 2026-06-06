const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// @route   GET /api/v1/users/me/history
// @desc    Get current user's reading history
router.get('/me/history', verifyAuth, userController.getReadingHistory);

// @route   POST /api/v1/users/me/history
// @desc    Record a reading history entry (view/bookmark/download)
router.post('/me/history', verifyAuth, userController.recordReadingHistory);

// @route   GET /api/v1/users/:id/profile
// @desc    Get complete user profile including stats and extended fields
router.get('/:id/profile', userController.getProfile);

module.exports = router;

