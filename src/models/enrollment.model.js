const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolled_at: {
        type: Date,
        default: Date.now
    },
    expires_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'expired', 'cancelled'],
        default: 'active'
    },
    progress_percent: {
        type: Number,
        default: 0
    }
});

// Index để tránh trùng lặp
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
