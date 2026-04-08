const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

// ---- Công khai ----

// POST /api/auth/register
router.post('/register', [
    body('name').notEmpty().withMessage('Tên không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
    validate
], authController.register);

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
    validate
], authController.login);

// POST /api/auth/google — đăng nhập / đăng ký bằng Google
router.post('/google', authController.googleAuth);

// POST /api/auth/forgot-password — gửi email đặt lại mật khẩu
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validate
], authController.forgotPassword);

// POST /api/auth/reset-password — đặt lại mật khẩu bằng token
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token là bắt buộc'),
    body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
    validate
], authController.resetPassword);

// ---- Cần đăng nhập ----

// GET /api/auth/me
router.get('/me', authMiddleware, authController.getMe);

// POST /api/auth/change-password — đổi mật khẩu (yêu cầu đang đăng nhập)
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
