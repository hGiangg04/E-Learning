const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');

const enrollmentController = {
    // GET /api/enrollments (Lấy enrollment của user đang login)
    getMyEnrollments: async (req, res) => {
        try {
            const enrollments = await Enrollment.find({ user_id: req.user._id })
                .populate('course_id', 'title thumbnail price instructor_id')
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

    // POST /api/enrollments (Đăng ký khóa học)
    enrollCourse: async (req, res) => {
        try {
            const { course_id } = req.body;

            // Kiểm tra khóa học tồn tại
            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            // Kiểm tra đã đăng ký chưa
            const existingEnrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id
            });

            if (existingEnrollment) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đăng ký khóa học này rồi'
                });
            }

            // Nếu khóa học có phí, cần xử lý thanh toán (sẽ implement sau)
            if (course.price > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng thanh toán trước khi đăng ký'
                });
            }

            // Tạo enrollment
            const enrollment = new Enrollment({
                user_id: req.user._id,
                course_id,
                status: 'active'
            });

            await enrollment.save();

            // Cập nhật số lượng học sinh
            await Course.findByIdAndUpdate(course_id, {
                $inc: { student_count: 1 }
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký khóa học thành công',
                data: { enrollment }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DELETE /api/enrollments/:courseId (Hủy đăng ký)
    cancelEnrollment: async (req, res) => {
        try {
            const enrollment = await Enrollment.findOneAndDelete({
                user_id: req.user._id,
                course_id: req.params.courseId
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bạn chưa đăng ký khóa học này'
                });
            }

            // Giảm số lượng học sinh
            await Course.findByIdAndUpdate(req.params.courseId, {
                $inc: { student_count: -1 }
            });

            res.json({
                success: true,
                message: 'Hủy đăng ký thành công'
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
