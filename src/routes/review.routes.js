const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/course/:courseId', reviewController.getByCourse);
router.get('/my', authMiddleware, reviewController.getMyReview);
router.post('/', authMiddleware, reviewController.createOrUpdate);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
