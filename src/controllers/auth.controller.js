const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const emailService = require('../services/email.service');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
}

const authController = {
    // POST /api/auth/register
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'name, email, password là bắt buộc'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu phải ít nhất 6 ký tự'
                });
            }

            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }

            const user = new User({
                name,
                email: email.toLowerCase(),
                password,
                role: 'student'
            });

            await user.save();

            const token = signToken(user);

            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: { user: user.profile, token }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/auth/login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            if (user.is_active !== 1) {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa'
                });
            }

            const token = signToken(user);

            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: { user: user.profile, token }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/auth/google — đăng nhập / đăng ký bằng Google
    googleAuth: async (req, res) => {
        try {
            const { id_token } = req.body;

            if (!id_token) {
                return res.status(400).json({
                    success: false,
                    message: 'id_token là bắt buộc'
                });
            }

            let payload;
            try {
                const ticket = await client.verifyIdToken({
                    idToken: id_token,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Token Google không hợp lệ'
                });
            }

            const { email, name, sub: google_id, picture } = payload;

            let user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                // Đã có tài khoản — cập nhật google_id nếu chưa có
                if (!user.google_id) {
                    user.google_id = google_id;
                    if (picture && !user.avatar) user.avatar = picture;
                    user.updated_at = Date.now();
                    await user.save();
                }
            } else {
                // Tạo tài khoản mới từ Google
                user = new User({
                    name,
                    email: email.toLowerCase(),
                    password: null,
                    google_id,
                    avatar: picture || '',
                    role: 'student'
                });
                await user.save();
            }

            if (user.is_active !== 1) {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa'
                });
            }

            const token = signToken(user);

            res.json({
                success: true,
                message: 'Đăng nhập Google thành công',
                data: { user: user.profile, token }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/auth/change-password — đổi mật khẩu (yêu cầu đang đăng nhập)
    changePassword: async (req, res) => {
        try {
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'current_password và new_password là bắt buộc'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải ít nhất 6 ký tự'
                });
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            // Nếu tài khoản Google chưa có mật khẩu -> cho phép tạo mới
            const needsPassword = !user.password;
            if (!needsPassword) {
                const isMatch = await user.comparePassword(current_password);
                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Mật khẩu hiện tại không đúng'
                    });
                }
            }

            user.password = new_password;
            user.updated_at = Date.now();
            await user.save();

            const token = signToken(user);

            res.json({
                success: true,
                message: 'Đổi mật khẩu thành công',
                data: { user: user.profile, token }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/auth/forgot-password — gửi email đặt lại mật khẩu
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'email là bắt buộc'
                });
            }

            const user = await User.findOne({ email: email.toLowerCase() });

            // Luôn trả thành công để tránh timing attack
            // và không tiết lộ email có tồn tại hay không
            if (!user || user.google_id) {
                return res.json({
                    success: true,
                    message: 'Nếu email tồn tại trong hệ thống và không phải tài khoản Google, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
                });
            }

            // Tạo reset token ngẫu nhiên
            const reset_token = crypto.randomBytes(32).toString('hex');
            const reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

            user.reset_token = reset_token;
            user.reset_token_expires = reset_token_expires;
            await user.save();

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${reset_token}`;

            // Gửi email thật (nếu cấu hình đúng)
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await emailService.sendResetPassword(user.email, resetLink, user.name);
            } else {
                // DEV: log link ra console khi chưa có email
                console.log(`\n[FORGOT PASSWORD — DEV] Link cho ${user.email}:`);
                console.log(`${resetLink}\n`);
            }

            res.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
                // ⚠️ DEV ONLY: trả token về client để test không cần email
                dev_token: process.env.NODE_ENV === 'development' ? reset_token : undefined
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/auth/reset-password — đặt lại mật khẩu bằng token
    resetPassword: async (req, res) => {
        try {
            const { token, new_password } = req.body;

            if (!token || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'token và new_password là bắt buộc'
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải ít nhất 6 ký tự'
                });
            }

            const user = await User.findOne({
                reset_token: token,
                reset_token_expires: { $gt: new Date() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                });
            }

            user.password = new_password;
            user.reset_token = null;
            user.reset_token_expires = null;
            user.updated_at = Date.now();
            await user.save();

            res.json({
                success: true,
                message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập với mật khẩu mới.'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/auth/me
    getMe: async (req, res) => {
        try {
            res.json({
                success: true,
                data: { user: req.user.profile }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = authController;
