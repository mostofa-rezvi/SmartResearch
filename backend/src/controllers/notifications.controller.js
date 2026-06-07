const notificationService = require('../services/notification.service');

/**
 * GET /api/v1/notifications
 * Returns paginated notifications for the authenticated user.
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await notificationService.getForUser(userId, limit, offset);

    res.status(200).json({
      success: true,
      data: notifications,
      meta: { limit, offset }
    });
  } catch (err) {
    console.error('[Notifications] getNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/notifications/unread-count
 * Returns the count of unread notifications (for the bell badge).
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.countUnread(req.user.id);
    res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    console.error('[Notifications] getUnreadCount error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/notifications/:id/read
 * Marks a single notification as read.
 */
exports.markOneRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }
    await notificationService.markRead(notificationId, req.user.id);
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('[Notifications] markOneRead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/notifications/read-all
 * Marks all of the current user's notifications as read.
 */
exports.markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Notifications] markAllRead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
