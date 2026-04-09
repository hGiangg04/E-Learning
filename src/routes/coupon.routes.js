const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

// ====== PUBLIC ROUTES (yêu cầu đăng nhập) ======

// Lấy danh sách coupon khả dụng theo khóa học
// GET /api/coupons/course/:courseId
router.get('/course/:courseId', authMiddleware, controller.getCouponsByCourse);

// Áp dụng mã coupon
// POST /api/coupons/apply
router.post('/apply', authMiddleware, controller.applyCoupon);

// ====== ADMIN ROUTES (yêu cầu admin) ======

// Tạo coupon mới
// POST /api/coupons
router.post('/', authMiddleware, adminOnly, controller.createCoupon);

// Lấy danh sách tất cả coupon
// GET /api/coupons
router.get('/', authMiddleware, adminOnly, controller.getCoupons);

// Lấy chi tiết 1 coupon
// GET /api/coupons/:id
router.get('/:id', authMiddleware, adminOnly, controller.getCouponById);

// Cập nhật coupon
// PUT /api/coupons/:id
router.put('/:id', authMiddleware, adminOnly, controller.updateCoupon);

// Xóa coupon
// DELETE /api/coupons/:id
router.delete('/:id', authMiddleware, adminOnly, controller.deleteCoupon);

module.exports = router;
