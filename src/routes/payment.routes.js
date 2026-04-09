const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Demo: sau này thay bằng webhook có xác thực chữ ký
router.post('/complete-by-order', paymentController.completeByOrderCode);

router.get('/admin', authMiddleware, adminOnly, paymentController.listForAdmin);
// Không đặt dưới /admin/... (tránh 404 với một số bản Express / proxy): một segment cố định
router.post(
    '/sync-completed-enrollments',
    authMiddleware,
    adminOnly,
    paymentController.syncEnrollmentsForCompletedPayments
);
router.patch('/admin/:id', authMiddleware, adminOnly, paymentController.updateAdminStatus);

module.exports = router;
