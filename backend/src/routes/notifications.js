const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(verifyAuth);

// @route   GET /api/v1/notifications
// @desc    Get paginated list of notifications for the current user
// @access  Private
router.get('/', notificationsController.getNotifications);

// @route   GET /api/v1/notifications/unread-count
// @desc    Get the count of unread notifications (for badge)
// @access  Private
router.get('/unread-count', notificationsController.getUnreadCount);

// @route   POST /api/v1/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.post('/:id/read', notificationsController.markOneRead);

// @route   POST /api/v1/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.post('/read-all', notificationsController.markAllRead);

module.exports = router;
