const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const adminController = require('../controllers/admin.controller');
const adminValidation = require('../validations/admin.validation');
const { auth, requireRole } = require('../middleware/auth');

// @route   POST /api/v1/admin/invite
// @desc    Initiate an exploration invite (Super Admin only)
router.post('/invite', 
  [auth, requireRole(['super_admin']), celebrate(adminValidation.invite)], 
  adminController.invite
);

module.exports = router;
