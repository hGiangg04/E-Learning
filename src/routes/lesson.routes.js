const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/course/:courseId', lessonController.getLessonsByCourse);
router.get('/:id', lessonController.getLessonById);

// Routes cần đăng nhập
router.post('/', authMiddleware, contentAdminOnly, lessonController.createLesson);
router.put('/:id', authMiddleware, contentAdminOnly, lessonController.updateLesson);
router.delete('/:id', authMiddleware, contentAdminOnly, lessonController.deleteLesson);

module.exports = router;
