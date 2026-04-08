const express = require('express');
const courseController = require('../controllers/course.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/admin/all', authMiddleware, contentAdminOnly, courseController.listAllForAdmin);

// Routes công khai
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Routes cần đăng nhập
router.post('/', authMiddleware, contentAdminOnly, courseController.createCourse);
router.put('/:id', authMiddleware, contentAdminOnly, courseController.updateCourse);
router.delete('/:id', authMiddleware, contentAdminOnly, courseController.deleteCourse);

module.exports = router;
