const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
    certificate_number: {
        type: String,
        required: true,
        unique: true
    },
    issued_at: {
        type: Date,
        default: Date.now
    },
    completion_percentage: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: null
    }
});

certificateSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
certificateSchema.index({ certificate_number: 1 }, { unique: true });
certificateSchema.index({ issued_at: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
