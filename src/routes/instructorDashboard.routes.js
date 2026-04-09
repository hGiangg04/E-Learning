const express = require('express');
const instructorDashboardController = require('../controllers/instructorDashboard.controller');
const { authMiddleware, instructorOrAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Tất cả routes cần đăng nhập và là giảng viên hoặc admin
router.use(authMiddleware);
router.use(instructorOrAdmin);

// Dashboard stats
router.get('/dashboard/stats', instructorDashboardController.getStats);

// Courses
router.get('/dashboard/courses', instructorDashboardController.getCourses);

// Students
router.get('/dashboard/students', instructorDashboardController.getStudents);

// Pending enrollments
router.get('/dashboard/pending-enrollments', instructorDashboardController.getPendingEnrollments);
router.patch('/dashboard/enrollments/:id/approve', instructorDashboardController.approveEnrollment);
router.patch('/dashboard/enrollments/:id/reject', instructorDashboardController.rejectEnrollment);

// Revenue
router.get('/dashboard/revenue', instructorDashboardController.getRevenue);

module.exports = router;