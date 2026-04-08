const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    is_completed: {
        type: Number,
        default: 0
    },
    progress_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    time_spent: {
        type: Number,
        default: 0
    },
    last_accessed_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date,
        default: null
    }
});

lessonProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
