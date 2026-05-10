const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const groupsController = require('../controllers/groups.controller');
const groupsValidation = require('../validations/groups.validation');
const { verifyAuth } = require('../middleware/auth.middleware');

// @route   POST /api/v1/groups
// @desc    Create a new research group
router.post('/', 
  [verifyAuth, celebrate(groupsValidation.createGroup)], 
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
  [verifyAuth, celebrate(groupsValidation.joinGroup)], 
  groupsController.join
);

// @route   GET /api/v1/groups/:id
// @desc    Get group details
router.get('/:id', 
  groupsController.get
);

// @route   POST /api/v1/groups/:id/leave
// @desc    Leave a group
router.post('/:id/leave', 
  [verifyAuth], 
  groupsController.leave
);

// @route   GET /api/v1/groups/:id/membership
// @desc    Check if user is a member
router.get('/:id/membership', 
  [verifyAuth], 
  groupsController.getMembership
);

// @route   GET /api/v1/groups/:id/members
// @desc    Get group members
router.get('/:id/members', 
  groupsController.getMembers
);

// @route   PATCH /api/v1/groups/:id/members/:userId/role
// @desc    Update member role (admin only)
router.patch('/:id/members/:userId/role',
  [verifyAuth],
  groupsController.updateMemberRole
);

module.exports = router;
