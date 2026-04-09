const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Sửa câu trả lời
// PUT /api/answers/:id
router.put('/:id', authMiddleware, questionController.updateAnswer);

// Xóa câu trả lời
// DELETE /api/answers/:id
router.delete('/:id', authMiddleware, questionController.deleteAnswer);

// Upvote câu trả lời
// POST /api/answers/:id/upvote
router.post('/:id/upvote', authMiddleware, questionController.upvoteAnswer);

module.exports = router;
