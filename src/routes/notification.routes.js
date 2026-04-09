const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// Lấy danh sách thông báo
router.get('/', notificationController.getMyNotifications);

// Đếm thông báo chưa đọc
router.get('/unread-count', notificationController.getUnreadCount);

// Đánh dấu đã đọc 1 thông báo
router.put('/:id/read', notificationController.markAsRead);

// Đánh dấu tất cả đã đọc
router.put('/read-all', notificationController.markAllAsRead);

// Xóa thông báo
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
