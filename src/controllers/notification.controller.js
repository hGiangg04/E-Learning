const Notification = require('../models/notification.model');

/**
 * Tạo thông báo cho một user.
 * Gọi từ các controller khác khi cần gửi thông báo.
 */
async function createNotification({ userId, type, title, message, link = null }) {
    try {
        await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            link
        });
    } catch (err) {
        // Không throw — thông báo không được phép crash flow chính
        console.error('createNotification error:', err.message);
    }
}

const notificationController = {
    /**
     * GET /api/notifications
     * Lấy danh sách thông báo của user (phân trang, mới nhất trước).
     */
    list: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [notifications, total, unreadCount] = await Promise.all([
                Notification.find({ user_id: req.user._id })
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Notification.countDocuments({ user_id: req.user._id }),
                Notification.countDocuments({ user_id: req.user._id, is_read: 0 })
            ]);

            res.json({
                success: true,
                data: {
                    notifications,
                    unread_count: unreadCount,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /api/notifications/unread-count
     * Lấy số thông báo chưa đọc (dùng cho badge real-time).
     */
    unreadCount: async (req, res) => {
        try {
            const count = await Notification.countDocuments({
                user_id: req.user._id,
                is_read: 0
            });
            res.json({ success: true, data: { count } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * PUT /api/notifications/:id/read
     * Đánh dấu 1 thông báo là đã đọc.
     */
    markRead: async (req, res) => {
        try {
            const notif = await Notification.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user._id },
                { is_read: 1 },
                { new: true }
            );
            if (!notif) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
            }
            res.json({ success: true, message: 'Đã đọc' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * PUT /api/notifications/read-all
     * Đánh dấu tất cả thông báo là đã đọc.
     */
    markAllRead: async (req, res) => {
        try {
            await Notification.updateMany(
                { user_id: req.user._id, is_read: 0 },
                { is_read: 1 }
            );
            res.json({ success: true, message: 'Đã đọc tất cả' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * DELETE /api/notifications/:id
     * Xóa 1 thông báo.
     */
    deleteNotification: async (req, res) => {
        try {
            const notif = await Notification.findOneAndDelete({
                _id: req.params.id,
                user_id: req.user._id
            });
            if (!notif) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
            }
            res.json({ success: true, message: 'Đã xóa thông báo' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = { notificationController, createNotification };
