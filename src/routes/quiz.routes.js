/**
 * Quiz — admin + học viên.
 * Mount: /api/quizzes
 */
const express = require('express');
const quizController = require('../controllers/quiz.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/course/:courseId', quizController.listByCourse);
router.get('/lesson/:lessonId', authMiddleware, quizController.getQuizByLesson);

router.get('/', authMiddleware, adminOnly, quizController.listAll);
router.post('/', authMiddleware, adminOnly, quizController.createQuiz);
router.get('/:id/detail', authMiddleware, adminOnly, quizController.getQuizDetail);
router.put('/:id', authMiddleware, adminOnly, quizController.updateQuiz);
router.delete('/:id', authMiddleware, adminOnly, quizController.deleteQuiz);
router.post('/:id/questions', authMiddleware, adminOnly, quizController.addQuestion);

router.get('/:id/take', authMiddleware, quizController.getQuizForTake);
router.get('/:id/attempts/mine', authMiddleware, quizController.listAttempts);
router.post('/:id/start', authMiddleware, quizController.startAttempt);
router.post('/attempts/:attemptId/submit', authMiddleware, quizController.submitAttempt);

module.exports = router;
