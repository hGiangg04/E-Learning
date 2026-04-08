const express = require('express');
const progressController = require('../controllers/progress.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.patch('/lessons/:lessonId', progressController.updateLessonProgress);
router.get('/courses/:courseId/lessons', progressController.getLessonProgressByCourse);
router.get('/courses/:courseId', progressController.getCourseProgress);

module.exports = router;
