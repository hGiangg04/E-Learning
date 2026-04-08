const express = require('express');
const userController = require('../controllers/user.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/:id', authMiddleware, userController.getUserById);

// Routes cần quyền admin
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, adminOnly, userController.deleteUser);

module.exports = router;
