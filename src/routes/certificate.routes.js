/**
 * Certificate — mount: /api/certificates
 */
const express = require('express');
const mongoose = require('mongoose');
const certificateController = require('../controllers/certificate.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Công khai — xác minh chứng chỉ
router.get('/verify/:certificateNumber', certificateController.verify);

// Yêu cầu đăng nhập
router.get('/my', authMiddleware, certificateController.listMy);
router.get('/check/:courseId', authMiddleware, certificateController.check);
router.post('/generate', authMiddleware, certificateController.generate);

module.exports = router;
