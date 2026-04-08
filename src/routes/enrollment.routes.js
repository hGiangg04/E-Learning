const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

router.get('/', enrollmentController.getMyEnrollments);
router.post('/', enrollmentController.enrollCourse);
router.delete('/:courseId', enrollmentController.cancelEnrollment);

module.exports = router;
