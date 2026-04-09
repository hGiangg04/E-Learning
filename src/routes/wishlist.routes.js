const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Tất cả các route đều cần đăng nhập
router.use(authMiddleware);

// Lấy danh sách wishlist của user
router.get('/', wishlistController.getMyWishlist);

// Thêm vào wishlist
router.post('/', wishlistController.addToWishlist);

// Kiểm tra khóa học có trong wishlist không
router.get('/check/:course_id', wishlistController.checkWishlist);

// Xóa khỏi wishlist
router.delete('/:course_id', wishlistController.removeFromWishlist);

module.exports = router;
