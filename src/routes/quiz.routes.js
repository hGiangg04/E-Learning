/**
 * Quiz — admin CRUD + học viên làm bài.
 * Mount: /api/quizzes
 */
const express = require('express');
const quizController = require('../controllers/quiz.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();
const requireAdmin = [authMiddleware, adminOnly];

router.get('/course/:courseId', quizController.listByCourse);
router.get('/lesson/:lessonId', authMiddleware, quizController.getQuizByLesson);

// Admin (đặt trước các route /:id/take để không bị nuốt nhầm)
router.get('/', ...requireAdmin, quizController.listAll);
router.post('/', ...requireAdmin, quizController.createQuiz);
router.get('/:id/detail', ...requireAdmin, quizController.getQuizDetail);
router.put('/:id', ...requireAdmin, quizController.updateQuiz);
router.delete('/:id', ...requireAdmin, quizController.deleteQuiz);
router.post('/:id/questions', ...requireAdmin, quizController.addQuestion);

router.get('/:id/take', authMiddleware, quizController.getQuizForTake);
router.get('/:id/attempts/mine', authMiddleware, quizController.listAttempts);
router.post('/:id/start', authMiddleware, quizController.startAttempt);
router.post('/attempts/:attemptId/submit', authMiddleware, quizController.submitAttempt);

module.exports = router;
