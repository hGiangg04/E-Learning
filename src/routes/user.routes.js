const express = require('express');
const userController = require('../controllers/user.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Admin: danh sách & quản lý trạng thái / vai trò
router.get('/', adminOnly, userController.getAllUsers);
router.patch('/:id/status', adminOnly, userController.setStatus);
router.patch('/:id/role', adminOnly, userController.setRole);
router.delete('/:id', adminOnly, userController.deleteUser);

// Admin hoặc chính user
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

module.exports = router;
