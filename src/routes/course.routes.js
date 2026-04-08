const express = require('express');
const courseController = require('../controllers/course.controller');
const { authMiddleware, contentAdminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Routes cần đăng nhập
router.post('/', authMiddleware, contentAdminOnly, courseController.createCourse);
router.put('/:id', authMiddleware, contentAdminOnly, courseController.updateCourse);
router.delete('/:id', authMiddleware, contentAdminOnly, courseController.deleteCourse);

module.exports = router;
