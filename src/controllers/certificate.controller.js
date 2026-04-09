const Certificate = require('../models/certificate.model');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const Progress = require('../models/progress.model');
const { createNotification } = require('./notification.controller');

function generateCertNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let num = 'CERT-';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) num += '-';
        num += chars[Math.floor(Math.random() * chars.length)];
    }
    return num;
}

const certificateController = {
    /**
     * GET /api/certificates/my
     * Lấy danh sách chứng chỉ của user đang đăng nhập.
     */
    listMy: async (req, res) => {
        try {
            const certs = await Certificate.find({ user_id: req.user._id })
                .populate('course_id', 'title thumbnail')
                .sort({ issued_at: -1 });
            res.json({ success: true, data: { certificates: certs } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /api/certificates/verify/:certificateNumber
     * Xác minh chứng chỉ công khai (ai cũng xem được).
     */
    verify: async (req, res) => {
        try {
            const cert = await Certificate.findOne({
                certificate_number: req.params.certificateNumber
            })
                .populate('user_id', 'name')
                .populate('course_id', 'title thumbnail instructor_id');

            if (!cert) {
                return res.status(404).json({
                    success: false,
                    message: 'Chứng chỉ không tồn tại hoặc đã bị thu hồi.'
                });
            }

            res.json({
                success: true,
                data: {
                    certificate_number: cert.certificate_number,
                    issued_at: cert.issued_at,
                    completion_percentage: cert.completion_percentage,
                    score: cert.score,
                    user: {
                        name: cert.user_id?.name || 'Không xác định'
                    },
                    course: {
                        title: cert.course_id?.title || 'Khóa học đã xóa',
                        thumbnail: cert.course_id?.thumbnail || null,
                        instructor: cert.course_id?.instructor_id?.name || null
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * POST /api/certificates/generate
     * Tạo chứng chỉ cho user: chỉ khi hoàn thành đủ % yêu cầu.
     * Tự động gọi khi học viên hoàn thành bài cuối, HOẶC gọi thủ công.
     */
    generate: async (req, res) => {
        try {
            const { course_id } = req.body;

            if (!course_id || !mongoose.Types.ObjectId.isValid(course_id)) {
                return res.status(400).json({ success: false, message: 'course_id không hợp lệ' });
            }

            // 1. Kiểm tra enrollment
            const enrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id,
                status: 'active'
            });
            if (!enrollment) {
                return res.status(403).json({ success: false, message: 'Bạn chưa đăng ký khóa học này' });
            }

            // 2. Chưa có chứng chỉ?
            let cert = await Certificate.findOne({ user_id: req.user._id, course_id });
            if (cert) {
                return res.json({
                    success: true,
                    message: 'Chứng chỉ đã được cấp trước đó',
                    data: { certificate: cert }
                });
            }

            // 3. Tính % hoàn thành từ progress
            const progresses = await Progress.find({
                user_id: req.user._id,
                course_id,
                is_completed: 1
            });
            const course = await Course.findById(course_id);
            const totalLessons = Array.isArray(course?.lessons) ? course.lessons.length : 0;
            const completionPct = totalLessons > 0
                ? Math.min(100, Math.round((progresses.length / totalLessons) * 100))
                : 0;

            // 4. Yêu cầu hoàn thành tối thiểu 80% (có thể chỉnh ở settings)
            const MIN_COMPLETION = 80;
            if (completionPct < MIN_COMPLETION) {
                return res.status(400).json({
                    success: false,
                    message: `Cần hoàn thành tối thiểu ${MIN_COMPLETION}% khóa học để nhận chứng chỉ (hiện tại: ${completionPct}%)`
                });
            }

            // 5. Tạo chứng chỉ
            let certNumber;
            let attempts = 0;
            do {
                certNumber = generateCertNumber();
                const existing = await Certificate.findOne({ certificate_number: certNumber });
                if (!existing) break;
                attempts++;
            } while (attempts < 10);
            if (attempts >= 10) {
                return res.status(500).json({ success: false, message: 'Không thể tạo mã chứng chỉ, thử lại' });
            }

            cert = await Certificate.create({
                user_id: req.user._id,
                course_id,
                certificate_number: certNumber,
                completion_percentage: completionPct
            });

            const populated = await Certificate.findById(cert._id)
                .populate('course_id', 'title thumbnail');

            await createNotification({
                userId: req.user._id,
                type: 'certificate',
                title: 'Bạn đã nhận được chứng chỉ!',
                message: `Chúc mừng bạn hoàn thành khóa học "${populated?.course_id?.title || ''}".`,
                link: '/my-certificates'
            });

            res.status(201).json({
                success: true,
                message: 'Chứng chỉ đã được cấp thành công!',
                data: { certificate: populated }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * GET /api/certificates/check/:courseId
     * Kiểm tra user đã có chứng chỉ cho khóa này chưa.
     */
    check: async (req, res) => {
        try {
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({ success: false, message: 'courseId không hợp lệ' });
            }
            const cert = await Certificate.findOne({
                user_id: req.user._id,
                course_id: courseId
            }).populate('course_id', 'title thumbnail');
            res.json({ success: true, data: { certificate: cert || null } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = certificateController;
