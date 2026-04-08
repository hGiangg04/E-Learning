const Payment = require('../models/payment.model');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');

/**
 * Kích hoạt đăng ký sau khi thanh toán thành công (webhook / cổng thanh toán).
 * Trong môi trường thật: xác thực chữ ký VNPay/MoMo rồi gọi logic tương tự.
 */
const paymentController = {
    // POST /api/payments/complete-by-order — demo: đánh dấu đơn completed và kích hoạt enrollment
    completeByOrderCode: async (req, res) => {
        try {
            const { order_code } = req.body;
            if (!order_code) {
                return res.status(400).json({
                    success: false,
                    message: 'order_code là bắt buộc'
                });
            }

            const payment = await Payment.findOne({ order_code });
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn thanh toán'
                });
            }

            if (payment.status === 'completed') {
                return res.json({
                    success: true,
                    message: 'Đơn đã được xử lý trước đó',
                    data: { payment }
                });
            }

            payment.status = 'completed';
            payment.paid_at = new Date();
            payment.auto_processed = 1;
            await payment.save();

            if (payment.enrollment_id) {
                const enrollment = await Enrollment.findById(payment.enrollment_id);
                if (enrollment && enrollment.status === 'pending') {
                    enrollment.status = 'active';
                    await enrollment.save();
                    await Course.findByIdAndUpdate(enrollment.course_id, {
                        $inc: { student_count: 1 }
                    });
                }
            }

            res.json({
                success: true,
                message: 'Thanh toán xác nhận — đăng ký đã được kích hoạt',
                data: { order_code: payment.order_code, status: payment.status }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = paymentController;
