const express = require('express');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

// Demo: sau này thay bằng webhook có xác thực chữ ký
router.post('/complete-by-order', paymentController.completeByOrderCode);

module.exports = router;
