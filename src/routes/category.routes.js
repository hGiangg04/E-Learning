const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes công khai
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Routes cần quyền admin
router.post('/', authMiddleware, adminOnly, categoryController.createCategory);
router.put('/:id', authMiddleware, adminOnly, categoryController.updateCategory);
router.delete('/:id', authMiddleware, adminOnly, categoryController.deleteCategory);

module.exports = router;
