const express = require('express');
const courseController = require('../controllers/course.controller');
const { authMiddleware, instructorOrAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Routes cần đăng nhập
router.post('/', authMiddleware, instructorOrAdmin, courseController.createCourse);
router.put('/:id', authMiddleware, instructorOrAdmin, courseController.updateCourse);
router.delete('/:id', authMiddleware, instructorOrAdmin, courseController.deleteCourse);

module.exports = router;
