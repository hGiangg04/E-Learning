const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/admin/pending', adminOnly, enrollmentController.listPending);
router.patch('/admin/:id/approve', adminOnly, enrollmentController.approveByAdmin);

router.get('/', enrollmentController.getMyEnrollments);
router.post('/', enrollmentController.enrollCourse);
router.delete('/course/:courseId', enrollmentController.cancelEnrollment);

module.exports = router;
