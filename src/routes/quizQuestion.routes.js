const express = require('express');
const router = express.Router();
const quizQuestionController = require('../controllers/quizQuestion.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Các route đều cần đăng nhập
router.use(authMiddleware);

// Lấy câu hỏi theo quiz
router.get('/quiz/:quiz_id', quizQuestionController.getQuestionsByQuiz);

// Thêm câu hỏi
router.post('/', quizQuestionController.addQuestion);

// Cập nhật câu hỏi
router.put('/:question_id', quizQuestionController.updateQuestion);

// Xóa câu hỏi
router.delete('/:question_id', quizQuestionController.deleteQuestion);

module.exports = router;
