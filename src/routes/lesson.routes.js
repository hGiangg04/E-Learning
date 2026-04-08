const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai — danh sách bài (không có content)
router.get('/course/:courseId', lessonController.getLessonsByCourse);

// Chi tiết bài học — cần JWT (kiểm tra ghi danh trong controller)
router.get('/:id', authMiddleware, lessonController.getLessonById);

// Routes cần đăng nhập
router.post('/', authMiddleware, contentAdminOnly, lessonController.createLesson);
router.put('/:id', authMiddleware, contentAdminOnly, lessonController.updateLesson);
router.delete('/:id', authMiddleware, contentAdminOnly, lessonController.deleteLesson);

module.exports = router;
