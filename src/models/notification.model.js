const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'enrollment_approved',  // Đăng ký được duyệt
            'enrollment_rejected',  // Đăng ký bị từ chối
            'comment',              // Có bình luận mới
            'reply',                // Có reply cho bình luận
            'certificate',          // Được cấp chứng chỉ
            'course_published',     // Khóa học mới được publish
            'system'                // Thông báo hệ thống
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    },
    is_read: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
