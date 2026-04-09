const mongoose = require('mongoose');
const User = require('../models/user.model');
const Course = require('../models/course.model');

const instructorController = {
    /** GET /api/instructors/:id — hồ sơ công khai của giảng viên + danh sách khóa đã xuất bản
     *  id có thể là user _id hoặc (fallback) course _id — nếu là course thì lấy instructor_id
     */
    getProfile: async (req, res) => {
        try {
            const raw = String(req.params.id || '').trim();

            if (!raw || !mongoose.Types.ObjectId.isValid(raw)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID giảng viên không hợp lệ'
                });
            }

            let instructorUserId = raw;

            let instructor = await User.findById(instructorUserId)
                .select('name avatar bio phone address created_at')
                .lean();

            if (!instructor) {
                const asCourse = await Course.findById(raw).select('instructor_id').lean();
                if (asCourse?.instructor_id) {
                    instructorUserId = String(asCourse.instructor_id);
                    instructor = await User.findById(instructorUserId)
                        .select('name avatar bio phone address created_at')
                        .lean();
                }
            }

            if (!instructor) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy giảng viên'
                });
            }

            const courses = await Course.find({
                instructor_id: instructorUserId,
                is_published: 1
            })
                .populate('category_id', 'name slug')
                .select('title slug thumbnail price discount_price average_rating review_count student_count duration_hours level created_at')
                .sort({ created_at: -1 })
                .lean();

            const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);
            const totalCourses = courses.length;
            const avgRating = totalCourses > 0
                ? courses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / totalCourses
                : 0;

            res.json({
                success: true,
                data: {
                    instructor: {
                        _id: instructor._id,
                        name: instructor.name,
                        avatar: instructor.avatar,
                        bio: instructor.bio,
                        phone: instructor.phone,
                        address: instructor.address,
                        created_at: instructor.created_at,
                        stats: {
                            total_courses: totalCourses,
                            total_students: totalStudents,
                            average_rating: Math.round(avgRating * 10) / 10
                        }
                    },
                    courses
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = instructorController;
