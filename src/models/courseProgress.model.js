const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
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
    progress_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lessons_completed: {
        type: Number,
        default: 0
    },
    total_lessons: {
        type: Number,
        default: 0
    },
    total_time_spent: {
        type: Number,
        default: 0
    },
    last_accessed_at: {
        type: Date,
        default: Date.now
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date,
        default: null
    }
});

courseProgressSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
