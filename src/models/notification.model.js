const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['enrollment', 'payment', 'quiz', 'course', 'system', 'achievement', 'review', 'certificate'],
        default: 'system'
    },
    title: {
        type: String,
        required: true,
        maxlength: [200, 'Tiêu đề không quá 200 ký tự']
    },
    message: {
        type: String,
        required: true,
        maxlength: [1000, 'Nội dung không quá 1000 ký tự']
    },
    link: {
        type: String,
        default: ''
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

// Index
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
