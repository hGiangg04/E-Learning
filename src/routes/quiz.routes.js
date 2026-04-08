const express = require('express');
const quizController = require('../controllers/quiz.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/course/:courseId', quizController.listByCourse);

router.get('/:id/take', authMiddleware, quizController.getQuizForTake);
router.get('/:id/attempts/mine', authMiddleware, quizController.listAttempts);
router.post('/:id/start', authMiddleware, quizController.startAttempt);
router.post('/attempts/:attemptId/submit', authMiddleware, quizController.submitAttempt);

router.get('/:id/detail', authMiddleware, contentAdminOnly, quizController.getQuizDetail);
router.post('/', authMiddleware, contentAdminOnly, quizController.createQuiz);
router.put('/:id', authMiddleware, contentAdminOnly, quizController.updateQuiz);
router.post('/:id/questions', authMiddleware, contentAdminOnly, quizController.addQuestion);

module.exports = router;
