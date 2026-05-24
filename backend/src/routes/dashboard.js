const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// GET /api/v1/dashboard/overview
router.get('/overview', verifyAuth, dashboardController.getOverview);

module.exports = router;
