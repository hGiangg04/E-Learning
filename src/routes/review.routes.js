const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Lấy reviews theo khóa học (public)
router.get('/course/:course_id', reviewController.getReviewsByCourse);

// Lấy review của user hiện tại (cần đăng nhập)
router.get('/my/:course_id', authMiddleware, reviewController.getMyReview);

// Tạo review (cần đăng nhập)
router.post('/', authMiddleware, reviewController.createReview);

// Cập nhật review (cần đăng nhập)
router.put('/:course_id', authMiddleware, reviewController.updateReview);

// Xóa review (cần đăng nhập)
router.delete('/:course_id', authMiddleware, reviewController.deleteReview);

module.exports = router;
