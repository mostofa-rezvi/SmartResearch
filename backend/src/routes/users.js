const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');

// @route   GET /api/v1/users/:id/profile
// @desc    Get complete user profile including stats and extended fields
router.get('/:id/profile', userController.getProfile);

module.exports = router;
