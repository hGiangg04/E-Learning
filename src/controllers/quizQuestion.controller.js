const Quiz = require('../models/quiz.model');
const QuizQuestion = require('../models/quizQuestion.model');
const QuestionOption = require('../models/questionOption.model');

// Thêm câu hỏi vào quiz
exports.addQuestion = async (req, res) => {
    try {
        const { quiz_id, question_text, question_type = 'single', points = 1, options, explanation } = req.body;

        if (!quiz_id || !question_text) {
            return res.status(400).json({ success: false, message: 'quiz_id và question_text là bắt buộc' });
        }

        if (!options || options.length < 2) {
            return res.status(400).json({ success: false, message: 'Cần ít nhất 2 đáp án' });
        }

        // Kiểm tra quiz tồn tại
        const quiz = await Quiz.findById(quiz_id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy quiz' });
        }

        // Tạo câu hỏi
        const question = new QuizQuestion({
            quiz_id,
            question_text,
            question_type,
            points,
            explanation
        });
        await question.save();

        // Tạo các đáp án
        const optionDocs = options.map(opt => ({
            question_id: question._id,
            option_text: opt.option_text,
            is_correct: opt.is_correct || false
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
        const { question_text, question_type, points, options, explanation } = req.body;

        const question = await QuizQuestion.findByIdAndUpdate(
            question_id,
            {
                ...(question_text && { question_text }),
                ...(question_type && { question_type }),
                ...(points !== undefined && { points }),
                ...(explanation !== undefined && { explanation })
            },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }

        // Cập nhật đáp án nếu có
        if (options) {
            await QuestionOption.deleteMany({ question_id });
            const optionDocs = options.map(opt => ({
                question_id: question._id,
                option_text: opt.option_text,
                is_correct: opt.is_correct || false
            }));
            await QuestionOption.insertMany(optionDocs);
        }

        // Lấy lại câu hỏi với đáp án
        const updated = await QuizQuestion.findById(question_id).populate('options');
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

        const questions = await QuizQuestion.find({ quiz_id })
            .populate('options')
            .sort({ created_at: 1 });

        res.json({ success: true, data: { questions } });
    } catch (error) {
        console.error('Lỗi getQuestionsByQuiz:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
