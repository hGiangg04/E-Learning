const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
    quiz_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    question_type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer'],
        default: 'multiple_choice'
    },
    question_text: { type: String, required: true },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1 },
    position: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 }
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
