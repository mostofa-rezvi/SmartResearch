const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const groupsController = require('../controllers/groups.controller');
const groupsValidation = require('../validations/groups.validation');
const { auth, requireOnboarding } = require('../middleware/auth');

// @route   POST /api/v1/groups
// @desc    Create a new research group
router.post('/', 
  [auth, requireOnboarding, celebrate(groupsValidation.createGroup)], 
  groupsController.create
);

// @route   GET /api/v1/groups
// @desc    Get all public groups
router.get('/', 
  groupsController.list
);

// @route   POST /api/v1/groups/:id/join
// @desc    Join a public group
router.post('/:id/join', 
  [auth, requireOnboarding, celebrate(groupsValidation.joinGroup)], 
  groupsController.join
);

module.exports = router;
