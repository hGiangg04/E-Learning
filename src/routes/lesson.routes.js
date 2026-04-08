const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/lessons/admin/course/:courseId — admin: đủ trường cho form sửa
router.get('/admin/course/:courseId', authMiddleware, contentAdminOnly, lessonController.listLessonsForAdmin);

// GET /api/lessons/course/:courseId?admin=1 — admin: đủ trường (có content/objectives) cho form sửa
//                                ?admin=  → không điều kiện — trả đủ trường
//                                không có  → chỉ trả list ngắn (không content/objectives)
router.get('/course/:courseId', lessonController.getLessonsByCourse);

// Chi tiết bài học — cần JWT (kiểm tra ghi danh trong controller)
router.get('/:id', authMiddleware, lessonController.getLessonById);

// Routes cần đăng nhập
router.post('/', authMiddleware, contentAdminOnly, lessonController.createLesson);
router.put('/:id', authMiddleware, contentAdminOnly, lessonController.updateLesson);
router.delete('/:id', authMiddleware, contentAdminOnly, lessonController.deleteLesson);

module.exports = router;
