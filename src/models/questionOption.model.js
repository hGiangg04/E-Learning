const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
    },
    option_text: { type: String, required: true },
    is_correct: { type: Number, default: 0 },
    position: { type: Number, default: 0 }
});

module.exports = mongoose.model('QuestionOption', questionOptionSchema);
