const Quiz = require('../models/quiz.model');
const QuizQuestion = require('../models/quizQuestion.model');
const QuestionOption = require('../models/questionOption.model');
const QuizAttempt = require('../models/quizAttempt.model');
const QuizAnswer = require('../models/quizAnswer.model');
const Enrollment = require('../models/enrollment.model');
const Lesson = require('../models/lesson.model');
const mongoose = require('mongoose');

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function stripCorrectFlags(questions, shuffleOptions) {
    return questions.map((q) => {
        const opts = (q.options || []).map((o) => ({
            id: o._id,
            option_text: o.option_text,
            position: o.position
        }));
        const ordered = shuffleOptions ? shuffleArray(opts) : opts.sort((a, b) => a.position - b.position);
        return {
            id: q._id,
            question_type: q.question_type,
            question_text: q.question_text,
            points: q.points,
            position: q.position,
            options: q.question_type === 'short_answer' ? [] : ordered
        };
    });
}

const quizController = {
    /** GET /api/quizzes/lesson/:lessonId — ưu tiên quiz gắn bài học; fallback quiz cấp khóa (legacy) */
    getQuizByLesson: async (req, res) => {
        try {
            const { lessonId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(lessonId)) {
                return res.status(400).json({ success: false, message: 'lessonId không hợp lệ' });
            }

            const lessonDoc = await Lesson.findById(lessonId);
            if (!lessonDoc) {
                return res.status(404).json({ success: false, message: 'Lesson không tồn tại' });
            }

            let quiz = await Quiz.findOne({
                lesson_id: lessonId,
                is_active: 1
            })
                .populate('course_id', 'title')
                .populate('lesson_id', 'title');

            if (!quiz) {
                quiz = await Quiz.findOne({
                    course_id: lessonDoc.course_id,
                    lesson_id: null,
                    is_active: 1
                }).populate('course_id', 'title');
            }

            if (!quiz) {
                return res.json({ success: true, data: { quiz: null } });
            }

            const questionCount = await QuizQuestion.countDocuments({
                quiz_id: quiz._id,
                is_active: 1
            });

            res.json({
                success: true,
                data: {
                    quiz: {
                        id: quiz._id,
                        title: quiz.title,
                        description: quiz.description,
                        quiz_type: quiz.quiz_type || 'multiple_choice',
                        passing_score: quiz.passing_score,
                        time_limit: quiz.time_limit,
                        max_attempts: quiz.max_attempts,
                        question_count: questionCount,
                        show_correct_answer: quiz.show_correct_answer,
                        show_results_immediately: quiz.show_results_immediately
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    listByCourse: async (req, res) => {
        try {
            const { courseId } = req.params;
            const quizzes = await Quiz.find({ course_id: courseId, is_active: 1 }).sort({ created_at: -1 });
            res.json({ success: true, data: { quizzes } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** GET /api/quizzes — admin: toàn bộ quiz + populate khóa học / bài học */
    listAll: async (req, res) => {
        try {
            const quizzes = await Quiz.find()
                .sort({ created_at: -1 })
                .populate('course_id', 'title')
                .populate('lesson_id', 'title');
            res.json({ success: true, data: { quizzes } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getQuizDetail: async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id)
                .populate('course_id', 'title')
                .populate('lesson_id', 'title');
            if (!quiz) {
                return res.status(404).json({ success: false, message: 'Quiz không tồn tại' });
            }
            let questions = await QuizQuestion.find({ quiz_id: quiz._id, is_active: 1 }).sort({ position: 1 });
            const out = [];
            for (const q of questions) {
                const options = await QuestionOption.find({ question_id: q._id }).sort({ position: 1 });
                out.push({ ...q.toObject(), options });
            }
            res.json({ success: true, data: { quiz, questions: out } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // GET /api/quizzes/:id/take — học viên: không lộ đáp án đúng; có thể xáo trộn
    getQuizForTake: async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz || !quiz.is_active) {
                return res.status(404).json({ success: false, message: 'Quiz không tồn tại' });
            }

            const enroll = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: quiz.course_id,
                status: 'active'
            });
            if (!enroll && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn cần đăng ký khóa học để làm bài'
                });
            }

            let questions = await QuizQuestion.find({ quiz_id: quiz._id, is_active: 1 }).sort({ position: 1 });
            const withOpts = [];
            for (const q of questions) {
                let options = await QuestionOption.find({ question_id: q._id }).sort({ position: 1 });
                if (quiz.shuffle_options) {
                    options = shuffleArray(options);
                }
                withOpts.push({ ...q.toObject(), options });
            }
            if (quiz.shuffle_questions) {
                questions = shuffleArray(withOpts);
            } else {
                questions = withOpts;
            }

            const safe = stripCorrectFlags(questions, false);

            res.json({
                success: true,
                data: {
                    quiz: {
                        id: quiz._id,
                        title: quiz.title,
                        description: quiz.description,
                        quiz_type: quiz.quiz_type || 'multiple_choice',
                        passing_score: quiz.passing_score,
                        time_limit: quiz.time_limit,
                        max_attempts: quiz.max_attempts
                    },
                    questions: safe
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createQuiz: async (req, res) => {
        try {
            const {
                lesson_id,
                quiz_type = 'multiple_choice',
                title,
                description = '',
                passing_score = 70,
                time_limit = 0,
                max_attempts = 1,
                shuffle_questions = 0,
                shuffle_options = 0,
                show_correct_answer = 1,
                show_results_immediately = 1,
                is_active = 1
            } = req.body;

            if (!lesson_id || !mongoose.Types.ObjectId.isValid(lesson_id)) {
                return res.status(400).json({ success: false, message: 'lesson_id là bắt buộc và phải hợp lệ' });
            }
            if (!title || !String(title).trim()) {
                return res.status(400).json({ success: false, message: 'title là bắt buộc' });
            }

            const lessonDoc = await Lesson.findById(lesson_id);
            if (!lessonDoc) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
            }

            const dup = await Quiz.findOne({ lesson_id, is_active: 1 });
            if (dup) {
                return res.status(400).json({
                    success: false,
                    message: 'Bài học này đã có quiz. Hãy sửa hoặc xóa quiz hiện có.'
                });
            }

            const allowedTypes = ['multiple_choice', 'essay', 'true_false'];
            const qt = allowedTypes.includes(quiz_type) ? quiz_type : 'multiple_choice';

            const quiz = new Quiz({
                lesson_id,
                course_id: lessonDoc.course_id,
                quiz_type: qt,
                title: String(title).trim(),
                description,
                passing_score,
                time_limit,
                max_attempts,
                shuffle_questions: shuffle_questions ? 1 : 0,
                shuffle_options: shuffle_options ? 1 : 0,
                show_correct_answer: show_correct_answer ? 1 : 0,
                show_results_immediately: show_results_immediately ? 1 : 0,
                is_active: is_active ? 1 : 0
            });
            await quiz.save();
            res.status(201).json({ success: true, message: 'Tạo quiz thành công', data: { quiz } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateQuiz: async (req, res) => {
        try {
            const existing = await Quiz.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Quiz không tồn tại' });
            }

            const patch = { ...req.body };
            delete patch.course_id;

            if (patch.lesson_id) {
                if (!mongoose.Types.ObjectId.isValid(patch.lesson_id)) {
                    return res.status(400).json({ success: false, message: 'lesson_id không hợp lệ' });
                }
                const lessonDoc = await Lesson.findById(patch.lesson_id);
                if (!lessonDoc) {
                    return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
                }
                const other = await Quiz.findOne({
                    lesson_id: patch.lesson_id,
                    is_active: 1,
                    _id: { $ne: existing._id }
                });
                if (other) {
                    return res.status(400).json({
                        success: false,
                        message: 'Bài học đích đã có quiz khác'
                    });
                }
                patch.course_id = lessonDoc.course_id;
            }

            if (patch.quiz_type) {
                const allowed = ['multiple_choice', 'essay', 'true_false'];
                if (!allowed.includes(patch.quiz_type)) delete patch.quiz_type;
            }

            const quiz = await Quiz.findByIdAndUpdate(req.params.id, patch, { new: true });
            res.json({ success: true, data: { quiz } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    deleteQuiz: async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) {
                return res.status(404).json({ success: false, message: 'Quiz không tồn tại' });
            }
            const questions = await QuizQuestion.find({ quiz_id: quiz._id });
            for (const q of questions) {
                await QuestionOption.deleteMany({ question_id: q._id });
            }
            await QuizQuestion.deleteMany({ quiz_id: quiz._id });
            await quiz.deleteOne();
            res.json({ success: true, message: 'Đã xóa quiz' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    addQuestion: async (req, res) => {
        try {
            const quiz_id = req.params.id;
            const { question_type, question_text, explanation, points, position, options } = req.body;

            const q = new QuizQuestion({
                quiz_id,
                question_type: question_type || 'multiple_choice',
                question_text,
                explanation,
                points: points ?? 1,
                position: position ?? 0
            });
            await q.save();

            if (options && Array.isArray(options)) {
                for (let i = 0; i < options.length; i++) {
                    await QuestionOption.create({
                        question_id: q._id,
                        option_text: options[i].option_text,
                        is_correct: options[i].is_correct ? 1 : 0,
                        position: options[i].position ?? i + 1
                    });
                }
            }

            res.status(201).json({ success: true, message: 'Đã thêm câu hỏi', data: { question: q } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    startAttempt: async (req, res) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) {
                return res.status(404).json({ success: false, message: 'Quiz không tồn tại' });
            }

            const enroll = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: quiz.course_id,
                status: 'active'
            });
            if (!enroll && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn cần đăng ký khóa học'
                });
            }

            const prev = await QuizAttempt.countDocuments({ user_id: req.user._id, quiz_id: quiz._id });
            if (quiz.max_attempts > 0 && prev >= quiz.max_attempts) {
                return res.status(400).json({
                    success: false,
                    message: 'Đã hết số lần làm bài cho phép'
                });
            }

            const attempt = await QuizAttempt.create({
                user_id: req.user._id,
                quiz_id: quiz._id,
                attempt_number: prev + 1,
                status: 'in_progress',
                started_at: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'Bắt đầu lượt làm bài',
                data: { attempt_id: attempt._id, attempt_number: attempt.attempt_number }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    submitAttempt: async (req, res) => {
        try {
            const { attemptId } = req.params;
            const { answers, time_spent } = req.body;

            const attempt = await QuizAttempt.findById(attemptId);
            if (!attempt || attempt.user_id.toString() !== req.user._id.toString()) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy lượt làm bài' });
            }
            if (attempt.status !== 'in_progress') {
                return res.status(400).json({ success: false, message: 'Lượt làm bài đã kết thúc' });
            }

            const quiz = await Quiz.findById(attempt.quiz_id);
            const questions = await QuizQuestion.find({ quiz_id: quiz._id });

            let totalPoints = 0;
            for (const qq of questions) {
                totalPoints += qq.points || 0;
            }

            let earned = 0;

            for (const a of answers || []) {
                const q = await QuizQuestion.findById(a.question_id);
                if (!q) continue;

                let isCorrect = 0;
                let pts = 0;

                if (q.question_type === 'short_answer') {
                    const text = (a.answer_text || '').trim();
                    if (text.length > 0) {
                        pts = q.points || 0;
                        isCorrect = 1;
                    } else {
                        pts = 0;
                        isCorrect = 0;
                    }
                } else if (a.option_id) {
                    const sel = await QuestionOption.findById(a.option_id);
                    if (sel && sel.is_correct) {
                        isCorrect = 1;
                        pts = q.points;
                    }
                }

                earned += pts;

                await QuizAnswer.findOneAndUpdate(
                    { attempt_id: attempt._id, question_id: q._id },
                    {
                        attempt_id: attempt._id,
                        question_id: q._id,
                        option_id: a.option_id || null,
                        answer_text: a.answer_text || '',
                        is_correct: isCorrect,
                        points_earned: pts
                    },
                    { upsert: true, new: true }
                );
            }

            const scorePercent = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
            const passed = scorePercent >= (quiz.passing_score || 0) ? 1 : 0;

            attempt.status = 'completed';
            attempt.completed_at = new Date();
            attempt.time_spent = Number(time_spent) || 0;
            attempt.total_points = totalPoints;
            attempt.earned_points = earned;
            attempt.score = scorePercent;
            attempt.is_passed = passed;
            await attempt.save();

            res.json({
                success: true,
                message: 'Đã nộp bài',
                data: {
                    attempt,
                    show_correct: quiz.show_correct_answer,
                    show_results_immediately: quiz.show_results_immediately
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    listAttempts: async (req, res) => {
        try {
            const attempts = await QuizAttempt.find({
                user_id: req.user._id,
                quiz_id: req.params.id
            }).sort({ attempt_number: -1 });

            res.json({ success: true, data: { attempts } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = quizController;
