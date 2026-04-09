const Question = require('../models/question.model');
const Answer = require('../models/answer.model');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');

/** Giống getCourseById: ObjectId 24 ký tự hoặc slug */
async function findCourseByIdOrSlug(param) {
    const p = String(param || '').trim();
    if (!p) return null;
    const isOid = /^[a-fA-F0-9]{24}$/.test(p);
    if (isOid) {
        const byId = await Course.findById(p);
        if (byId) return byId;
    }
    return Course.findOne({ slug: p });
}

const controller = {};

// ====== Tạo câu hỏi mới ======
controller.createQuestion = async (req, res) => {
    try {
        const { course_id, lesson_id, title, content } = req.body;

        if (!course_id || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Khóa học, tiêu đề và nội dung là bắt buộc'
            });
        }

        const course = await findCourseByIdOrSlug(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Khóa học không tồn tại'
            });
        }

        // Nếu có lesson_id, kiểm tra bài học tồn tại và thuộc khóa học
        if (lesson_id) {
            const lesson = await Lesson.findById(lesson_id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }
            if (lesson.course_id.toString() !== course._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Bài học không thuộc khóa học này'
                });
            }
        }

        const question = await Question.create({
            course_id: course._id,
            lesson_id: lesson_id || null,
            user_id: req.user._id,
            title: title.trim(),
            content: content.trim()
        });

        const populatedQuestion = await Question.findById(question._id)
            .populate('user_id', 'name email avatar')
            .populate('course_id', 'title slug')
            .populate('lesson_id', 'title');

        return res.status(201).json({
            success: true,
            message: 'Đã đăng câu hỏi thành công',
            data: populatedQuestion
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo câu hỏi'
        });
    }
};

// ====== Lấy câu hỏi theo khóa học ======
controller.getQuestionsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 10, lesson_id, is_resolved, search, sort = '-created_at' } = req.query;

        const course = await findCourseByIdOrSlug(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Khóa học không tồn tại'
            });
        }

        const filter = { course_id: course._id };
        if (lesson_id) filter.lesson_id = lesson_id;
        if (is_resolved !== undefined) filter.is_resolved = is_resolved === 'true';
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [questions, total] = await Promise.all([
            Question.find(filter)
                .populate('user_id', 'name email avatar')
                .populate('lesson_id', 'title')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Question.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: questions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy câu hỏi'
        });
    }
};

// ====== Lấy câu hỏi theo bài học ======
controller.getQuestionsByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { page = 1, limit = 20, search, sort = '-created_at' } = req.query;

        // Kiểm tra bài học tồn tại
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Bài học không tồn tại'
            });
        }

        const filter = { lesson_id: lessonId };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [questions, total] = await Promise.all([
            Question.find(filter)
                .populate('user_id', 'name email avatar')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Question.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: questions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy câu hỏi'
        });
    }
};

// ====== Lấy chi tiết câu hỏi + câu trả lời ======
controller.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id)
            .populate('user_id', 'name email avatar')
            .populate('course_id', 'title slug')
            .populate('lesson_id', 'title');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        // Lấy câu trả lời, câu của giảng viên lên đầu
        const answers = await Answer.find({ question_id: id })
            .populate('user_id', 'name email avatar role')
            .sort({ is_instructor: -1, upvotes: -1, created_at: 1 });

        return res.status(200).json({
            success: true,
            data: {
                ...question.toJSON(),
                answers
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy câu hỏi'
        });
    }
};

// ====== Sửa câu hỏi ======
controller.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_pinned } = req.body;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        // Chỉ người hỏi hoặc admin mới được sửa
        const isAdmin = req.user.role === 'admin';
        if (question.user_id.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa câu hỏi này'
            });
        }

        if (title !== undefined) question.title = title.trim();
        if (content !== undefined) question.content = content.trim();
        if (is_pinned !== undefined && isAdmin) question.is_pinned = is_pinned;

        await question.save();

        const updatedQuestion = await Question.findById(id)
            .populate('user_id', 'name email avatar')
            .populate('course_id', 'title slug')
            .populate('lesson_id', 'title');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật câu hỏi thành công',
            data: updatedQuestion
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật câu hỏi'
        });
    }
};

// ====== Xóa câu hỏi ======
controller.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        // Chỉ người hỏi hoặc admin mới được xóa
        const isAdmin = req.user.role === 'admin';
        if (question.user_id.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa câu hỏi này'
            });
        }

        // Xóa tất cả câu trả lời liên quan
        await Answer.deleteMany({ question_id: id });
        await Question.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Xóa câu hỏi và câu trả lời thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa câu hỏi'
        });
    }
};

// ====== Thêm câu trả lời ======
controller.createAnswer = async (req, res) => {
    try {
        const { id: question_id } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung câu trả lời là bắt buộc'
            });
        }

        const question = await Question.findById(question_id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        // Kiểm tra người trả lời có phải giảng viên khóa học không
        const course = await Course.findById(question.course_id);
        const isInstructor = course && course.instructor_id &&
            course.instructor_id.toString() === req.user._id.toString();

        const answer = await Answer.create({
            question_id,
            user_id: req.user._id,
            content: content.trim(),
            is_instructor: isInstructor
        });

        // Cập nhật answer_count của câu hỏi
        await Question.findByIdAndUpdate(question_id, {
            $inc: { answer_count: 1 }
        });

        const populatedAnswer = await Answer.findById(answer._id)
            .populate('user_id', 'name email avatar role');

        // Emit socket nếu có
        const { getIO } = require('../config/socket');
        const io = getIO();
        if (io) {
            io.to(`user:${question.user_id}`).emit('new_answer', {
                question_id,
                answer: populatedAnswer,
                question_title: question.title
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Đã gửi câu trả lời',
            data: populatedAnswer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi gửi câu trả lời'
        });
    }
};

// ====== Sửa câu trả lời ======
controller.updateAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const answer = await Answer.findById(id);
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Câu trả lời không tồn tại'
            });
        }

        const isAdmin = req.user.role === 'admin';
        if (answer.user_id.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa câu trả lời này'
            });
        }

        if (content !== undefined) answer.content = content.trim();
        await answer.save();

        const updatedAnswer = await Answer.findById(id)
            .populate('user_id', 'name email avatar role');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật câu trả lời thành công',
            data: updatedAnswer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật câu trả lời'
        });
    }
};

// ====== Xóa câu trả lời ======
controller.deleteAnswer = async (req, res) => {
    try {
        const { id } = req.params;

        const answer = await Answer.findById(id);
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Câu trả lời không tồn tại'
            });
        }

        const isAdmin = req.user.role === 'admin';
        if (answer.user_id.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa câu trả lời này'
            });
        }

        await Answer.findByIdAndDelete(id);
        await Question.findByIdAndUpdate(answer.question_id, {
            $inc: { answer_count: -1 }
        });

        return res.status(200).json({
            success: true,
            message: 'Xóa câu trả lời thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa câu trả lời'
        });
    }
};

// ====== Upvote câu trả lời ======
controller.upvoteAnswer = async (req, res) => {
    try {
        const { id } = req.params;

        const answer = await Answer.findById(id);
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: 'Câu trả lời không tồn tại'
            });
        }

        const userId = req.user._id.toString();
        const alreadyUpvoted = answer.upvoted_by.some(
            uid => uid.toString() === userId
        );

        if (alreadyUpvoted) {
            // Bỏ upvote
            await Answer.findByIdAndUpdate(id, {
                $pull: { upvoted_by: userId },
                $inc: { upvotes: -1 }
            });
            return res.status(200).json({
                success: true,
                message: 'Đã bỏ upvote',
                data: { upvoted: false }
            });
        } else {
            // Thêm upvote
            await Answer.findByIdAndUpdate(id, {
                $addToSet: { upvoted_by: userId },
                $inc: { upvotes: 1 }
            });
            return res.status(200).json({
                success: true,
                message: 'Đã upvote',
                data: { upvoted: true }
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi upvote'
        });
    }
};

// ====== Đánh dấu đã giải quyết ======
controller.resolveQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Câu hỏi không tồn tại'
            });
        }

        // Chỉ người hỏi hoặc admin hoặc giảng viên khóa học mới được đánh dấu
        const isAdmin = req.user.role === 'admin';
        const course = await Course.findById(question.course_id);
        const isInstructor = course && course.instructor_id &&
            course.instructor_id.toString() === req.user._id.toString();
        const isAuthor = question.user_id.toString() === req.user._id.toString();

        if (!isAdmin && !isInstructor && !isAuthor) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền đánh dấu câu hỏi này'
            });
        }

        question.is_resolved = !question.is_resolved;
        await question.save();

        const updatedQuestion = await Question.findById(id)
            .populate('user_id', 'name email avatar')
            .populate('course_id', 'title slug')
            .populate('lesson_id', 'title');

        return res.status(200).json({
            success: true,
            message: question.is_resolved ? 'Đã đánh dấu là đã giải quyết' : 'Đã bỏ đánh dấu',
            data: updatedQuestion
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật trạng thái'
        });
    }
};

module.exports = controller;
