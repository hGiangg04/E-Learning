const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const emailService = {
    /**
     * Gửi email đặt lại mật khẩu
     * @param {string} to - Email người nhận
     * @param {string} resetLink - Link đặt lại mật khẩu
     * @param {string} userName - Tên người dùng (để personalized)
     */
    sendResetPassword: async (to, resetLink, userName) => {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: 'E-Learning - Yêu cầu đặt lại mật khẩu',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { background: #ffffff; border-radius: 8px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .content { color: #333; line-height: 1.6; }
        .btn { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        .btn:hover { background: #2563eb; }
        .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .warning { background: #fff7ed; border: 1px solid #fed7aa; padding: 12px; border-radius: 6px; font-size: 13px; color: #9a3412; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📚 E-Learning</div>
        </div>
        <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản E-Learning của bạn.</p>
            <p style="text-align: center;">
                <a href="${resetLink}" class="btn">Đặt lại mật khẩu</a>
            </p>
            <p>Hoặc sao chép đường link bên dưới và dán vào trình duyệt:</p>
            <p style="word-break: break-all; font-size: 13px; background: #f9f9f9; padding: 10px; border-radius: 4px;">${resetLink}</p>
            <div class="warning">
                ⚠️ Link này có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
            </div>
        </div>
        <div class="footer">
            <p>E-Learning Platform — Hệ thống học trực tuyến</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Email send failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    },

    /**
     * Gửi email chào mừng khi đăng ký tài khoản mới (tùy chọn)
     */
    sendWelcome: async (to, userName) => {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: 'Chào mừng đến với E-Learning! 🎉',
                html: `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #3b82f6;">Chào mừng ${userName}!</h2>
    <p>Cảm ơn bạn đã đăng ký E-Learning. Chúc bạn học tập hiệu quả!</p>
    <a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Bắt đầu học ngay</a>
</div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Welcome email failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;
