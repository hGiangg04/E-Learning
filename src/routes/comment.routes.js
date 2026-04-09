/**
 * Comment — mount: /api/comments
 * Hỗ trợ bình luận khóa học (course) và bài học (lesson).
 */
const express = require('express');
const commentController = require('../controllers/comment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', commentController.getComments);
router.post('/', authMiddleware, commentController.create);
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
