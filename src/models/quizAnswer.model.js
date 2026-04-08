const mongoose = require('mongoose');

const quizAnswerSchema = new mongoose.Schema({
    attempt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizAttempt',
        required: true
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
    },
    option_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionOption',
        default: null
    },
    answer_text: { type: String, default: '' },
    is_correct: { type: Number, default: 0 },
    points_earned: { type: Number, default: 0 }
});

quizAnswerSchema.index({ attempt_id: 1, question_id: 1 }, { unique: true });

module.exports = mongoose.model('QuizAnswer', quizAnswerSchema);
