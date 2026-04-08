const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        default: null
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    passing_score: { type: Number, default: 70 },
    time_limit: { type: Number, default: 0 },
    max_attempts: { type: Number, default: 1 },
    shuffle_questions: { type: Number, default: 0 },
    shuffle_options: { type: Number, default: 0 },
    show_correct_answer: { type: Number, default: 1 },
    show_results_immediately: { type: Number, default: 1 },
    is_active: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
