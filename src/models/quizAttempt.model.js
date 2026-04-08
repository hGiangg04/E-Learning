const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    attempt_number: { type: Number, required: true },
    started_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    time_spent: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    total_points: { type: Number, default: 0 },
    earned_points: { type: Number, default: 0 },
    is_passed: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    }
});

quizAttemptSchema.index({ user_id: 1, quiz_id: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
