const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// Lấy giỏ hàng
router.get('/', cartController.getMyCart);

// Thêm vào giỏ hàng
router.post('/', cartController.addToCart);

// Xóa khỏi giỏ hàng
router.delete('/:course_id', cartController.removeFromCart);

// Xóa tất cả giỏ hàng
router.delete('/', cartController.clearCart);

// Checkout
router.post('/checkout', cartController.checkout);

module.exports = router;
