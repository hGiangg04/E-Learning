/**
 * Quiz — học viên / luồng làm bài.
 * Mount: /api/quizzes
 */
const express = require('express');
const quizController = require('../controllers/quiz.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/course/:courseId', quizController.listByCourse);
router.get('/lesson/:lessonId', authMiddleware, quizController.getQuizByLesson);

router.get('/:id/take', authMiddleware, quizController.getQuizForTake);
router.get('/:id/attempts/mine', authMiddleware, quizController.listAttempts);
router.post('/:id/start', authMiddleware, quizController.startAttempt);
router.post('/attempts/:attemptId/submit', authMiddleware, quizController.submitAttempt);

module.exports = router;
