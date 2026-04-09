const mongoose = require('mongoose');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const Payment = require('../models/payment.model');
const { resolveCourseByParam } = require('../utils/resolveCourseByParam');
const { activateEnrollmentFromPayment } = require('../utils/activateEnrollmentFromPayment');
const { emitNotification } = require('../utils/socketEmit');

function generateOrderCode() {
    return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const enrollmentController = {
    // GET /api/enrollments/access/:courseId — đã ghi danh / có thể học chưa
    checkCourseAccess: async (req, res) => {
        try {
            const { courseId: raw } = req.params;
            const course = await resolveCourseByParam(raw);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }
            const courseId = course._id;

            let enrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: courseId
            });

            if (req.user.role !== 'admin') {
                if (!enrollment || enrollment.status !== 'active') {
                    const completedPay = await Payment.findOne({
                        user_id: req.user._id,
                        course_id: courseId,
                        status: 'completed'
                    });
                    if (completedPay) {
                        await activateEnrollmentFromPayment(completedPay);
                        enrollment = await Enrollment.findOne({
                            user_id: req.user._id,
                            course_id: courseId
                        });
                    }
                }
            }

            if (req.user.role === 'admin') {
                return res.json({
                    success: true,
                    data: {
                        enrolled: !!enrollment,
                        status: enrollment?.status ?? null,
                        canLearn: true,
                        adminFullAccess: true
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    enrolled: !!enrollment,
                    status: enrollment?.status ?? null,
                    canLearn: enrollment?.status === 'active'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getMyEnrollments: async (req, res) => {
        try {
            // Đồng bộ ghi danh từ mọi thanh toán đã completed (tránh lệch sau khi admin duyệt / lỗi tạm thời)
            const paid = await Payment.find({ user_id: req.user._id, status: 'completed' });
            for (const p of paid) {
                await activateEnrollmentFromPayment(p);
            }

            const enrollments = await Enrollment.find({ user_id: req.user._id })
                .populate('course_id', 'title thumbnail price category_id')
                .sort({ enrolled_at: -1 });

            res.json({
                success: true,
                data: { enrollments }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/enrollments — free: active; có phí: pending + tạo payment pending
    // Hỗ trợ coupon: { course_id, coupon_code? }
    enrollCourse: async (req, res) => {
        try {
            const { course_id, coupon_code } = req.body;

            if (!course_id || !mongoose.Types.ObjectId.isValid(course_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'course_id không hợp lệ'
                });
            }

            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            const existingEnrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id
            });

            if (existingEnrollment) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đăng ký khóa học này rồi',
                    data: { enrollment: existingEnrollment }
                });
            }

            const price = Number(course.price) || 0;
            const isAdmin = req.user.role === 'admin';

            if (price <= 0 || isAdmin) {
                const enrollment = new Enrollment({
                    user_id: req.user._id,
                    course_id,
                    status: 'active'
                });
                await enrollment.save();

                await Course.findByIdAndUpdate(course_id, { $inc: { student_count: 1 } });

                // Gửi thông báo real-time cho học sinh
                await emitNotification({
                    userId: req.user._id.toString(),
                    type: 'enrollment',
                    title: 'Đăng ký thành công!',
                    message: `Bạn đã được ghi danh khóa học "${course.title}" miễn phí. Hãy bắt đầu học ngay!`,
                    link: `/lessons/${course._id}`
                });

                return res.status(201).json({
                    success: true,
                    message: isAdmin && price > 0
                        ? 'Admin: đã kích hoạt học khóa học (không cần thanh toán)'
                        : 'Đăng ký khóa học miễn phí thành công',
                    data: { enrollment, needPayment: false }
                });
            }

            // Xử lý coupon nếu có
            let couponInfo = null;
            let finalAmount = price;

            if (coupon_code) {
                const Coupon = require('../models/coupon.model');
                const normalizedCode = coupon_code.trim().toUpperCase();
                const coupon = await Coupon.findOne({ code: normalizedCode });

                if (!coupon) {
                    return res.status(404).json({
                        success: false,
                        message: 'Mã coupon không tồn tại'
                    });
                }

                if (coupon.course_id.toString() !== course_id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã coupon không áp dụng cho khóa học này'
                    });
                }

                const now = Date.now();
                if (!coupon.is_active || coupon.start_date > now || coupon.end_date < now) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã coupon không hợp lệ hoặc đã hết hạn'
                    });
                }

                if (coupon.used_count >= coupon.usage_limit) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mã coupon đã hết lượt sử dụng'
                    });
                }

                couponInfo = {
                    coupon_id: coupon._id,
                    coupon_code: coupon.code,
                    discount_percent: coupon.discount_percent,
                    discount_amount: coupon.calculateDiscount(price),
                    original_amount: price
                };
                finalAmount = coupon.getFinalPrice(price);
            }

            const enrollment = new Enrollment({
                user_id: req.user._id,
                course_id,
                status: 'pending'
            });
            await enrollment.save();

            const order_code = generateOrderCode();
            const payment = new Payment({
                user_id: req.user._id,
                course_id,
                enrollment_id: enrollment._id,
                order_code,
                amount: finalAmount,
                original_amount: couponInfo ? price : null,
                coupon_id: couponInfo ? couponInfo.coupon_id : null,
                coupon_code: couponInfo ? couponInfo.coupon_code : null,
                discount_percent: couponInfo ? couponInfo.discount_percent : 0,
                discount_amount: couponInfo ? couponInfo.discount_amount : 0,
                payment_method: req.body.payment_method || 'pending',
                status: 'pending'
            });
            await payment.save();

            // Tăng used_count của coupon nếu có
            if (couponInfo) {
                const Coupon = require('../models/coupon.model');
                await Coupon.findByIdAndUpdate(couponInfo.coupon_id, { $inc: { used_count: 1 } });
            }

            const message = couponInfo
                ? `Đăng ký đang chờ thanh toán. Mã giảm giá ${couponInfo.discount_percent}% đã được áp dụng.`
                : 'Đăng ký đang chờ thanh toán. Sau khi thanh toán thành công, khóa học sẽ được kích hoạt tự động (hoặc admin duyệt).';

            // Thông báo cho học sinh cần thanh toán
            await emitNotification({
                userId: req.user._id.toString(),
                type: 'payment',
                title: 'Chờ thanh toán',
                message: `Bạn đã đăng ký khóa học "${course.title}" (${finalAmount.toLocaleString('vi-VN')}đ). Vui lòng hoàn tất thanh toán để được kích hoạt.`,
                link: '/cart'
            });

            // Thông báo cho admin có đơn thanh toán mới
            await emitNotificationToAdmin({
                type: 'payment',
                title: 'Yêu cầu thanh toán mới',
                message: `Học sinh ${req.user.name} đăng ký khóa học "${course.title}" — cần xác nhận.`,
                link: '/admin/payments'
            });

            return res.status(201).json({
                success: true,
                message,
                data: {
                    enrollment,
                    needPayment: true,
                    payment: {
                        order_code,
                        amount: finalAmount,
                        original_amount: couponInfo ? price : null,
                        discount_amount: couponInfo ? couponInfo.discount_amount : 0,
                        discount_percent: couponInfo ? couponInfo.discount_percent : 0,
                        coupon_code: couponInfo ? couponInfo.coupon_code : null,
                        status: 'pending'
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PATCH /api/enrollments/admin/:id/approve — admin kích hoạt đăng ký pending
    approveByAdmin: async (req, res) => {
        try {
            const enrollment = await Enrollment.findById(req.params.id);
            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bản ghi đăng ký không tồn tại'
                });
            }

            if (enrollment.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Đăng ký đã được kích hoạt'
                });
            }

            enrollment.status = 'active';
            await enrollment.save();

            await Course.findByIdAndUpdate(enrollment.course_id, {
                $inc: { student_count: 1 }
            });

            // Lấy thông tin khóa học + user để gửi notification
            const populated = await Enrollment.findById(enrollment._id)
                .populate('course_id', 'title')
                .populate('user_id', 'name');

            // Thông báo cho học sinh
            if (populated?.user_id && populated?.course_id) {
                await emitNotification({
                    userId: populated.user_id._id.toString(),
                    type: 'enrollment',
                    title: 'Đăng ký đã được kích hoạt!',
                    message: `Khóa học "${populated.course_id.title}" đã sẵn sàng. Bạn có thể bắt đầu học ngay!`,
                    link: `/lessons/${enrollment.course_id}`
                });
            }

            res.json({
                success: true,
                message: 'Đã kích hoạt đăng ký khóa học',
                data: { enrollment: populated }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/enrollments/admin/pending — admin xem danh sách chờ duyệt
    listPending: async (req, res) => {
        try {
            const enrollments = await Enrollment.find({ status: 'pending' })
                .populate('user_id', 'name email')
                .populate('course_id', 'title price')
                .sort({ enrolled_at: -1 });

            res.json({
                success: true,
                data: { enrollments }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    cancelEnrollment: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'courseId không hợp lệ'
                });
            }

            const enrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: req.params.courseId
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bạn chưa đăng ký khóa học này'
                });
            }

            if (enrollment.status === 'active') {
                await Course.findByIdAndUpdate(req.params.courseId, {
                    $inc: { student_count: -1 }
                });
            }

            await Enrollment.findByIdAndDelete(enrollment._id);
            await Payment.deleteMany({ enrollment_id: enrollment._id });

            res.json({
                success: true,
                message: 'Đã hủy đăng ký'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = enrollmentController;
