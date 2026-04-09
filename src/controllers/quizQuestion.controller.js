const Quiz = require('../models/quiz.model');
const QuizQuestion = require('../models/quizQuestion.model');
const QuestionOption = require('../models/questionOption.model');

function normalizeQuestionType(raw, quizType) {
    if (raw === 'single' || raw === 'multiple_choice') return 'multiple_choice';
    if (raw === 'true_false') return 'true_false';
    if (raw === 'short_answer' || raw === 'essay') return 'short_answer';
    if (quizType === 'essay') return 'short_answer';
    if (quizType === 'true_false') return 'true_false';
    return 'multiple_choice';
}

// Thêm câu hỏi vào quiz
exports.addQuestion = async (req, res) => {
    try {
        const { quiz_id, question_text, question_type: rawType = 'multiple_choice', points = 1, options, explanation } = req.body;

        if (!quiz_id || !question_text) {
            return res.status(400).json({ success: false, message: 'quiz_id và question_text là bắt buộc' });
        }

        const quiz = await Quiz.findById(quiz_id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
        }

        const question_type = normalizeQuestionType(rawType, quiz.quiz_type);

        if (question_type === 'short_answer') {
            const question = new QuizQuestion({
                quiz_id,
                question_text,
                question_type: 'short_answer',
                points,
                explanation: explanation || ''
            });
            await question.save();
            const count = await QuizQuestion.countDocuments({ quiz_id });
            await Quiz.findByIdAndUpdate(quiz_id, { question_count: count });
            return res.status(201).json({
                success: true,
                message: 'Đã thêm câu hỏi',
                data: { question }
            });
        }

        if (!options || options.length < 2) {
            return res.status(400).json({ success: false, message: 'Cần ít nhất 2 đáp án' });
        }

        const question = new QuizQuestion({
            quiz_id,
            question_text,
            question_type,
            points,
            explanation: explanation || ''
        });
        await question.save();

        const optionDocs = options.map((opt, i) => ({
            question_id: question._id,
            option_text: opt.option_text,
            is_correct: opt.is_correct ? 1 : 0,
            position: opt.position ?? i + 1
        }));
        await QuestionOption.insertMany(optionDocs);

        // Cập nhật số câu hỏi của quiz
        const count = await QuizQuestion.countDocuments({ quiz_id });
        await Quiz.findByIdAndUpdate(quiz_id, { question_count: count });

        res.status(201).json({
            success: true,
            message: 'Đã thêm câu hỏi',
            data: { question }
        });
    } catch (error) {
        console.error('Lỗi addQuestion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Cập nhật câu hỏi
exports.updateQuestion = async (req, res) => {
    try {
        const { question_id } = req.params;
        const { question_text, question_type: rawQType, points, options, explanation } = req.body;

        const patch = {};
        if (question_text !== undefined) patch.question_text = question_text;
        if (rawQType !== undefined) patch.question_type = normalizeQuestionType(rawQType, null);
        if (points !== undefined) patch.points = points;
        if (explanation !== undefined) patch.explanation = explanation;

        const question = await QuizQuestion.findByIdAndUpdate(question_id, patch, { new: true });

        if (!question) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        const effectiveType = question.question_type;

        if (effectiveType === 'short_answer') {
            await QuestionOption.deleteMany({ question_id });
        } else if (options && Array.isArray(options) && options.length >= 2) {
            await QuestionOption.deleteMany({ question_id });
            const optionDocs = options.map((opt, i) => ({
                question_id: question._id,
                option_text: opt.option_text,
                is_correct: opt.is_correct ? 1 : 0,
                position: opt.position ?? i + 1
            }));
            await QuestionOption.insertMany(optionDocs);
        }

        const opts = await QuestionOption.find({ question_id }).sort({ position: 1 });
        const updated = { ...question.toObject(), options: opts.map((o) => o.toObject()) };
        res.json({ success: true, message: 'Đã cập nhật câu hỏi', data: { question: updated } });
    } catch (error) {
        console.error('Lỗi updateQuestion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
    try {
        const { question_id } = req.params;

        const question = await QuizQuestion.findById(question_id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        const quizId = question.quiz_id;

        // Xóa đáp án trước
        await QuestionOption.deleteMany({ question_id });
        // Xóa câu hỏi
        await QuizQuestion.findByIdAndDelete(question_id);

        // Cập nhật số câu hỏi của quiz
        const count = await QuizQuestion.countDocuments({ quiz_id: quizId });
        await Quiz.findByIdAndUpdate(quizId, { question_count: count });

        res.json({ success: true, message: 'Đã xóa câu hỏi' });
    } catch (error) {
        console.error('Lỗi deleteQuestion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy câu hỏi theo quiz
exports.getQuestionsByQuiz = async (req, res) => {
    try {
        const { quiz_id } = req.params;

        const rows = await QuizQuestion.find({ quiz_id }).sort({ position: 1, created_at: 1 });
        const questions = [];
        for (const q of rows) {
            const opts = await QuestionOption.find({ question_id: q._id }).sort({ position: 1 });
            questions.push({ ...q.toObject(), options: opts.map((o) => o.toObject()) });
        }

        res.json({ success: true, data: { questions } });
    } catch (error) {
        console.error('Lỗi getQuestionsByQuiz:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
