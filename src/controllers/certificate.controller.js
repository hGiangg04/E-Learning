const UserCertificate = require('../models/userCertificate.model');
const Course = require('../models/course.model');
const { resolveCourseByParam } = require('../utils/resolveCourseByParam');
const Enrollment = require('../models/enrollment.model');
const CourseProgress = require('../models/courseProgress.model');
const { createNotification } = require('./notification.controller');

/**
 * Cấp chứng chỉ nếu chưa có + gửi thông báo (chỉ khi vừa tạo mới).
 * Gọi sau khi CourseProgress đạt 100% hoặc từ API /certificates/check.
 */
exports.tryIssueCertificateForCompletedCourse = async (userId, courseId) => {
    try {
        const existingBefore = await UserCertificate.findOne({ user_id: userId, course_id: courseId });
        const cert = await exports.issueCertificate(userId, courseId);
        if (!cert) return { certificate: null, newlyIssued: false };

        const newlyIssued = !existingBefore;
        if (newlyIssued) {
            const courseDoc = await Course.findById(courseId).select('title');
            await createNotification({
                userId,
                type: 'certificate',
                title: 'Chúc mừng! Bạn đã nhận chứng chỉ',
                message: `Bạn đã hoàn thành khóa học "${courseDoc?.title || 'Khóa học'}". Nhấn để xem chi tiết chứng chỉ.`,
                link: `/certificates/${cert.certificate_number}`
            });
        }
        return { certificate: cert, newlyIssued };
    } catch (error) {
        console.error('Lỗi tryIssueCertificateForCompletedCourse:', error);
        return { certificate: null, newlyIssued: false };
    }
};

// Lấy tất cả chứng chỉ của user
exports.getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;

        const certificates = await UserCertificate.find({ user_id: userId, status: 'active' })
            .populate({
                path: 'course_id',
                select: 'title thumbnail instructor_id category_id',
                populate: [
                    { path: 'instructor_id', select: 'name avatar' }
                ]
            })
            .sort({ issued_at: -1 });

        res.json({
            success: true,
            data: { certificates }
        });
    } catch (error) {
        console.error('Lỗi getMyCertificates:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy chi tiết 1 chứng chỉ
exports.getCertificateDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { certNumber } = req.params;

        const cert = await UserCertificate.findOne({
            certificate_number: certNumber,
            user_id: userId
        }).populate({
            path: 'course_id',
            select: 'title thumbnail description instructor_id category_id',
            populate: [
                { path: 'instructor_id', select: 'name avatar' }
            ]
        });

        if (!cert) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chứng chỉ' });
        }

        res.json({
            success: true,
            data: { certificate: cert }
        });
    } catch (error) {
        console.error('Lỗi getCertificateDetail:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xác minh chứng chỉ (public - ai cũng xem được)
exports.verifyCertificate = async (req, res) => {
    try {
        const { certNumber } = req.params;

        const cert = await UserCertificate.findOne({
            certificate_number: certNumber,
            status: 'active'
        }).populate({
            path: 'course_id',
            select: 'title',
            populate: { path: 'instructor_id', select: 'name' }
        }).populate('user_id', 'name email');

        if (!cert) {
            return res.status(404).json({
                success: false,
                message: 'Chứng chỉ không tồn tại hoặc đã bị thu hồi'
            });
        }

        res.json({
            success: true,
            data: {
                is_valid: true,
                certificate: {
                    certificate_number: cert.certificate_number,
                    user_name: cert.user_id?.name,
                    course_title: cert.course_id?.title,
                    instructor_name: cert.course_id?.instructor_id?.name,
                    issued_at: cert.issued_at,
                    expires_at: cert.expires_at,
                    status: cert.status
                }
            }
        });
    } catch (error) {
        console.error('Lỗi verifyCertificate:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Cấp chứng chỉ (internal - gọi khi hoàn thành khóa học)
exports.issueCertificate = async (userId, courseId) => {
    try {
        // Kiểm tra đã có chưa
        const existing = await UserCertificate.findOne({ user_id: userId, course_id: courseId });
        if (existing) return existing;

        const cert = new UserCertificate({
            user_id: userId,
            course_id: courseId
        });
        await cert.save();
        return cert;
    } catch (error) {
        console.error('Lỗi issueCertificate:', error);
        return null;
    }
};

// Kiểm tra và cấp chứng chỉ nếu hoàn thành khóa học
exports.checkAndIssueCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'course_id là bắt buộc' });
        }

        const course = await resolveCourseByParam(course_id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
        }

        const resolvedCourseId = course._id;

        // Kiểm tra đã hoàn thành chưa
        const progress = await CourseProgress.findOne({ user_id: userId, course_id: resolvedCourseId });
        if (!progress || Number(progress.progress_percentage) < 100) {
            return res.status(400).json({
                success: false,
                message: 'Bạn cần hoàn thành 100% khóa học để nhận chứng chỉ'
            });
        }

        const { certificate: cert, newlyIssued } = await exports.tryIssueCertificateForCompletedCourse(
            userId,
            resolvedCourseId
        );

        if (!cert) {
            return res.status(500).json({ success: false, message: 'Không thể cấp chứng chỉ' });
        }

        res.json({
            success: true,
            message: newlyIssued
                ? 'Chúc mừng bạn đã hoàn thành khóa học!'
                : 'Bạn đã có chứng chỉ cho khóa học này',
            data: { certificate: cert, newly_issued: newlyIssued }
        });
    } catch (error) {
        console.error('Lỗi checkAndIssueCertificate:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
