const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Xác minh chứng chỉ (public)
router.get('/verify/:certNumber', certificateController.verifyCertificate);

// Lấy chứng chỉ của user (cần đăng nhập)
router.get('/my', authMiddleware, certificateController.getMyCertificates);

// Lấy chi tiết chứng chỉ (cần đăng nhập)
router.get('/:certNumber', authMiddleware, certificateController.getCertificateDetail);

// Kiểm tra và cấp chứng chỉ (cần đăng nhập)
router.post('/check', authMiddleware, certificateController.checkAndIssueCertificate);

module.exports = router;
