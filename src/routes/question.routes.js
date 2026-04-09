const express = require('express');
const router = express.Router();
const controller = require('../controllers/question.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// ====== PUBLIC ROUTES (yêu cầu đăng nhập) ======

// Lấy câu hỏi theo khóa học
// GET /api/questions/course/:courseId
router.get('/course/:courseId', authMiddleware, controller.getQuestionsByCourse);

// Lấy câu hỏi theo bài học
// GET /api/questions/lesson/:lessonId
router.get('/lesson/:lessonId', authMiddleware, controller.getQuestionsByLesson);

// Lấy chi tiết câu hỏi + câu trả lời
// GET /api/questions/:id
router.get('/:id', authMiddleware, controller.getQuestionById);

// ====== USER ROUTES ======

// Tạo câu hỏi mới
// POST /api/questions
router.post('/', authMiddleware, controller.createQuestion);

// Sửa câu hỏi
// PUT /api/questions/:id
router.put('/:id', authMiddleware, controller.updateQuestion);

// Xóa câu hỏi
// DELETE /api/questions/:id
router.delete('/:id', authMiddleware, controller.deleteQuestion);

// Đánh dấu đã giải quyết
// PATCH /api/questions/:id/resolve
router.patch('/:id/resolve', authMiddleware, controller.resolveQuestion);

// ====== ANSWER ROUTES ======

// Thêm câu trả lời
// POST /api/questions/:id/answers
router.post('/:id/answers', authMiddleware, controller.createAnswer);

module.exports = router;
