const Notification = require('../models/notification.model');

// Tạo thông báo (dùng nội bộ bởi các service khác)
exports.createNotification = async ({ userId, type, title, message, link }) => {
    try {
        const notification = new Notification({
            user_id: userId,
            type: type || 'system',
            title,
            message,
            link: link || ''
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Lỗi tạo notification:', error);
        return null;
    }
};

// Lấy danh sách thông báo của user
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find({ user_id: userId })
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments({ user_id: userId });
        const unread = await Notification.countDocuments({ user_id: userId, is_read: 0 });

        res.json({
            success: true,
            data: {
                notifications,
                unread_count: unread,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Lỗi getMyNotifications:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Đếm thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Notification.countDocuments({ user_id: userId, is_read: 0 });
        res.json({ success: true, data: { unread_count: count } });
    } catch (error) {
        console.error('Lỗi getUnreadCount:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Đánh dấu đã đọc 1 thông báo
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await Notification.findOneAndUpdate(
            { _id: id, user_id: userId },
            { is_read: 1 }
        );

        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        console.error('Lỗi markAsRead:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Đánh dấu tất cả đã đọc
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { user_id: userId, is_read: 0 },
            { is_read: 1 }
        );

        res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
        console.error('Lỗi markAllAsRead:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await Notification.findOneAndDelete({ _id: id, user_id: userId });

        res.json({ success: true, message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('Lỗi deleteNotification:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
