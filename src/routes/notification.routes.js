/**
 * Notification — mount: /api/notifications
 */
const express = require('express');
const { notificationController } = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, notificationController.list);
router.get('/unread-count', authMiddleware, notificationController.unreadCount);
router.put('/read-all', authMiddleware, notificationController.markAllRead);
router.put('/:id/read', authMiddleware, notificationController.markRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;
