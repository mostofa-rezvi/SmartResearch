const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// Admin-only analytics routes
// Note: isAdmin check done inside controller using req.user.role

// @route   GET /api/v1/analytics/overview
// @desc    Platform-wide stats for admin dashboard
// @access  Admin
router.get('/overview', verifyAuth, analyticsController.getOverview);

// @route   GET /api/v1/analytics/match-quality
// @desc    Recommendation score distribution data
// @access  Admin
router.get('/match-quality', verifyAuth, analyticsController.getMatchQuality);

// @route   GET /api/v1/analytics/collaboration
// @desc    Project/milestone completion rates
// @access  Admin
router.get('/collaboration', verifyAuth, analyticsController.getCollaboration);

// @route   GET /api/v1/analytics/growth
// @desc    Weekly new user registrations (last 8 weeks)
// @access  Admin
router.get('/growth', verifyAuth, analyticsController.getGrowth);

// @route   GET /api/v1/analytics/publications
// @desc    Publication outcomes and reading engagement stats
// @access  Admin
router.get('/publications', verifyAuth, analyticsController.getPublicationOutcomes);

// @route   GET /api/v1/analytics/weekly-report
// @desc    Downloadable weekly report (JSON or CSV)
// @access  Admin
router.get('/weekly-report', verifyAuth, analyticsController.getWeeklyReport);

module.exports = router;
