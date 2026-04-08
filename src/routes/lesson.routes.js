const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const { authMiddleware, instructorOrAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/course/:courseId', lessonController.getLessonsByCourse);
router.get('/:id', lessonController.getLessonById);

// Routes cần đăng nhập
router.post('/', authMiddleware, instructorOrAdmin, lessonController.createLesson);
router.put('/:id', authMiddleware, instructorOrAdmin, lessonController.updateLesson);
router.delete('/:id', authMiddleware, instructorOrAdmin, lessonController.deleteLesson);

module.exports = router;
