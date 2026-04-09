/**
 * Tiện ích gửi thông báo real-time qua Socket.io + lưu vào DB.
 *
 * Cách dùng:
 *   const { emitNotification } = require('../utils/socketEmit');
 *   await emitNotification({
 *     userId: '...',
 *     type: 'payment',
 *     title: 'Thanh toán thành công',
 *     message: 'Bạn đã đăng ký khóa học ...',
 *     link: '/my-courses'
 *   });
 */
const { getIO } = require('../config/socket');
const Notification = require('../models/notification.model');

/**
 * Tạo notification trong DB + emit real-time qua Socket.io.
 * @param {object} params
 * @param {string} params.userId     — MongoDB ObjectId dạng string
 * @param {string} params.type       — enum: enrollment|payment|quiz|course|system|achievement|review|certificate
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.link]     — đường dẫn frontend, mặc định ''
 * @param {string} [params.excludeSocketId] — bỏ qua socket cụ thể (thường là sender)
 */
async function emitNotification({ userId, type, title, message, link = '', excludeSocketId = null }) {
    // Lưu DB
    let savedNotif = null;
    try {
        const notif = new Notification({ user_id: userId, type, title, message, link });
        savedNotif = await notif.save();
    } catch (err) {
        console.error('[socketEmit] Lỗi lưu notification:', err.message);
    }

    const payload = {
        _id: savedNotif?._id,
        type,
        title,
        message,
        link,
        is_read: 0,
        created_at: savedNotif?.created_at || new Date(),
    };

    // Gửi real-time — không cần backend xác thực CORS (server-side emit)
    const io = getIO();
    if (io) {
        const room = `user:${userId}`;
        const sockets = await io.in(room).fetchSockets();
        for (const sock of sockets) {
            if (excludeSocketId && sock.id === excludeSocketId) continue;
            sock.emit('notification', payload);
        }
        // Nếu không có socket nào online (user offline), payload vẫn đã lưu DB
        // → khi đăng nhập sẽ load từ API bình thường
    }

    return savedNotif;
}

/**
 * Gửi thông báo cho admin (tất cả user có role=admin).
 * @param {object} params — giống emitNotification, không cần userId
 */
async function emitNotificationToAdmin({ type, title, message, link = '' }) {
    const io = getIO();
    if (!io) return;

    // Lưu DB cho tất cả admin
    const User = require('../models/user.model');
    const admins = await User.find({ role: 'admin' }).select('_id');
    const payloads = admins.map(admin =>
        emitNotification({ userId: admin._id.toString(), type, title, message, link })
    );
    await Promise.allSettled(payloads);

    // Emit room admin
    io.to('room:admin').emit('notification', { type, title, message, link, is_read: 0, created_at: new Date() });
}

module.exports = { emitNotification, emitNotificationToAdmin };
