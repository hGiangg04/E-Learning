const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Enrollment = require('../models/enrollment.model');
const { activateEnrollmentFromPayment } = require('../utils/activateEnrollmentFromPayment');
const { emitNotification, emitNotificationToAdmin } = require('../utils/socketEmit');

function toUiStatus(dbStatus) {
    if (dbStatus === 'completed') return 'approved';
    if (dbStatus === 'failed' || dbStatus === 'cancelled') return 'rejected';
    return 'pending';
}

function formatPaymentRow(doc) {
    const p = doc.toObject ? doc.toObject() : doc;
    const user =
        p.user_id && typeof p.user_id === 'object' && p.user_id.name !== undefined
            ? p.user_id
            : null;
    const course =
        p.course_id && typeof p.course_id === 'object' && p.course_id.title !== undefined
            ? p.course_id
            : null;
    const created = p.created_at || p.createdAt;
    return {
        _id: String(p._id),
        user: {
            name: user?.name || '—',
            email: user?.email || '—'
        },
        course: {
            title: course?.title || '—'
        },
        amount: p.amount,
        method: p.payment_method || 'pending',
        status: toUiStatus(p.status),
        createdAt: created
            ? new Date(created).toISOString().slice(0, 10)
            : '—'
    };
}

/**
 * Kích hoạt đăng ký sau khi thanh toán thành công (webhook / cổng thanh toán).
 * Trong môi trường thật: xác thực chữ ký VNPay/MoMo rồi gọi logic tương tự.
 */
const paymentController = {
    // GET /api/payments/admin — danh sách thanh toán (admin)
    listForAdmin: async (req, res) => {
        try {
            const list = await Payment.find({})
                .populate('user_id', 'name email')
                .populate('course_id', 'title')
                .sort({ created_at: -1 })
                .lean();

            const payments = list.map((row) => formatPaymentRow(row));
            res.json({ success: true, data: { payments } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // PATCH /api/payments/admin/:id — duyệt / từ chối (admin)
    updateAdminStatus: async (req, res) => {
        try {
            const { decision } = req.body;
            if (!['approve', 'reject'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'decision phải là approve hoặc reject'
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ success: false, message: 'id không hợp lệ' });
            }

            const payment = await Payment.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
            }

            if (payment.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Chỉ xử lý được giao dịch đang chờ (pending)'
                });
            }

            if (decision === 'approve') {
                payment.status = 'completed';
                payment.paid_at = new Date();
                payment.auto_processed = 1;
                await payment.save();
                await activateEnrollmentFromPayment(payment);

                // Lấy thông tin để gửi notification
                const populated = await Payment.findById(payment._id)
                    .populate('user_id', 'name')
                    .populate('course_id', 'title');

                // Thông báo cho học sinh
                if (populated?.user_id && populated?.course_id) {
                    await emitNotification({
                        userId: populated.user_id._id.toString(),
                        type: 'payment',
                        title: 'Thanh toán đã được duyệt!',
                        message: `Thanh toán cho khóa học "${populated.course_id.title}" đã được xác nhận. Khóa học đã sẵn sàng!`,
                        link: '/my-courses'
                    });
                }
            } else {
                payment.status = 'failed';
                await payment.save();
                if (payment.enrollment_id) {
                    await Enrollment.findByIdAndDelete(payment.enrollment_id);
                }

                const populated = await Payment.findById(payment._id)
                    .populate('user_id', 'name')
                    .populate('course_id', 'title');

                if (populated?.user_id && populated?.course_id) {
                    await emitNotification({
                        userId: populated.user_id._id.toString(),
                        type: 'payment',
                        title: 'Thanh toán bị từ chối',
                        message: `Thanh toán cho khóa học "${populated.course_id.title}" không được duyệt. Vui lòng thử lại hoặc liên hệ hỗ trợ.`,
                        link: '/cart'
                    });
                }
            }

            const updated = await Payment.findById(payment._id)
                .populate('user_id', 'name email')
                .populate('course_id', 'title');

            res.json({
                success: true,
                message: decision === 'approve' ? 'Đã duyệt thanh toán' : 'Đã từ chối thanh toán',
                data: { payment: formatPaymentRow(updated) }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

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
                await activateEnrollmentFromPayment(payment);
                return res.json({
                    success: true,
                    message: 'Đơn đã completed — đã đồng bộ ghi danh (nếu thiếu)',
                    data: { payment }
                });
            }

            payment.status = 'completed';
            payment.paid_at = new Date();
            payment.auto_processed = 1;
            await payment.save();

            await activateEnrollmentFromPayment(payment);

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
    },

    /** POST /api/payments/sync-completed-enrollments — sửa payment completed nhưng enrollment_id null (dữ liệu cũ / lỗi tạm thời) */
    syncEnrollmentsForCompletedPayments: async (req, res) => {
        try {
            const list = await Payment.find({
                status: 'completed',
                $or: [{ enrollment_id: null }, { enrollment_id: { $exists: false } }]
            });
            for (const p of list) {
                await activateEnrollmentFromPayment(p);
            }
            const stillMissing = await Payment.countDocuments({
                status: 'completed',
                $or: [{ enrollment_id: null }, { enrollment_id: { $exists: false } }]
            });
            res.json({
                success: true,
                message: 'Đã chạy đồng bộ ghi danh cho thanh toán completed',
                data: {
                    processed: list.length,
                    still_missing_enrollment_id: stillMissing
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = paymentController;
