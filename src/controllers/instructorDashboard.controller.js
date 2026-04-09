const mongoose = require('mongoose');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const User = require('../models/user.model');
const Payment = require('../models/payment.model');

const instructorDashboardController = {
    /** GET /api/instructors/dashboard/stats - Lấy thống kê tổng quan cho giảng viên */
    getStats: async (req, res) => {
        try {
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';

            // Điều kiện truy vấn: nếu là admin thì lấy tất cả khóa, không thì chỉ lấy khóa của mình
            const courseFilter = isAdmin ? {} : { instructor_id: instructorId };

            // Tổng số khóa học
            const totalCourses = await Course.countDocuments(courseFilter);

            // Tổng số học viên (đếm unique user_id từ enrollment của các khóa)
            const courses = await Course.find(courseFilter).select('_id').lean();
            const courseIds = courses.map(c => c._id);

            let totalStudents = 0;
            let totalRevenue = 0;
            let avgRating = 0;

            if (courseIds.length > 0) {
                // Đếm học viên đã enroll (status active)
                const studentCountResult = await Enrollment.aggregate([
                    { $match: { course_id: { $in: courseIds }, status: 'active' } },
                    { $group: { _id: '$user_id' } },
                    { $count: 'total' }
                ]);
                totalStudents = studentCountResult[0]?.total || 0;

                // Tính doanh thu từ payments đã approve
                const paymentResult = await Payment.aggregate([
                    { $match: { course_id: { $in: courseIds }, status: 'approved' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);
                totalRevenue = paymentResult[0]?.total || 0;

                // Tính rating trung bình
                const ratingResult = await Course.aggregate([
                    { $match: { ...courseFilter, average_rating: { $gt: 0 } } },
                    { $group: { _id: null, avgRating: { $avg: '$average_rating' } } }
                ]);
                avgRating = ratingResult[0]?.avgRating || 0;
            }

            // Khóa học pending (chờ duyệt enrollment)
            const pendingEnrollmentsCount = await Enrollment.countDocuments({
                course_id: { $in: courseIds },
                status: 'pending'
            });

            res.json({
                success: true,
                data: {
                    totalCourses,
                    totalStudents,
                    totalRevenue,
                    averageRating: Math.round(avgRating * 10) / 10,
                    pendingEnrollmentsCount
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /** GET /api/instructors/dashboard/courses - Danh sách khóa học */
    getCourses: async (req, res) => {
        try {
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';
            const { page = 1, limit = 10, status } = req.query;

            const filter = {};
            if (!isAdmin) {
                filter.instructor_id = instructorId;
            }
            if (status === 'published') {
                filter.is_published = 1;
            } else if (status === 'draft') {
                filter.is_published = 0;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [courses, total] = await Promise.all([
                Course.find(filter)
                    .populate('category_id', 'name')
                    .select('title thumbnail price discount_price average_rating review_count student_count is_published created_at level')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Course.countDocuments(filter)
            ]);

            res.json({
                success: true,
                data: {
                    courses,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit))
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

    /** GET /api/instructors/dashboard/students - Danh sách học viên */
    getStudents: async (req, res) => {
        try {
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';
            const { page = 1, limit = 10, courseId } = req.query;

            // Lấy danh sách course của giảng viên
            const courseFilter = isAdmin ? {} : { instructor_id: instructorId };
            const courses = await Course.find(courseFilter).select('_id').lean();
            const courseIds = courses.map(c => c._id);

            if (courseIds.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        students: [],
                        pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
                    }
                });
            }

            // Filter theo course nếu có
            const enrollmentMatch = { course_id: { $in: courseIds }, status: 'active' };
            if (courseId) {
                enrollmentMatch.course_id = new mongoose.Types.ObjectId(courseId);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Đếm tổng unique students
            const totalStudents = await Enrollment.aggregate([
                { $match: enrollmentMatch },
                { $group: { _id: '$user_id' } },
                { $count: 'total' }
            ]);

            // Lấy danh sách enrollments với thông tin user
            const enrollments = await Enrollment.aggregate([
                { $match: enrollmentMatch },
                { $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $lookup: {
                    from: 'courses',
                    localField: 'course_id',
                    foreignField: '_id',
                    as: 'course'
                }},
                { $unwind: '$user' },
                { $unwind: '$course' },
                { $sort: { enrolled_at: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $project: {
                    _id: 1,
                    enrolled_at: 1,
                    progress_percent: 1,
                    user: { _id: 1, name: 1, email: 1, avatar: 1 },
                    course: { _id: 1, title: 1, thumbnail: 1 }
                }}
            ]);

            res.json({
                success: true,
                data: {
                    students: enrollments,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalStudents[0]?.total || 0,
                        totalPages: Math.ceil((totalStudents[0]?.total || 0) / parseInt(limit))
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

    /** GET /api/instructors/dashboard/pending-enrollments - Danh sách đăng ký chờ duyệt */
    getPendingEnrollments: async (req, res) => {
        try {
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';
            const { page = 1, limit = 10 } = req.query;

            const courseFilter = isAdmin ? {} : { instructor_id: instructorId };
            const courses = await Course.find(courseFilter).select('_id').lean();
            const courseIds = courses.map(c => c._id);

            if (courseIds.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        enrollments: [],
                        pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
                    }
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [enrollments, total] = await Promise.all([
                Enrollment.find({ course_id: { $in: courseIds }, status: 'pending' })
                    .populate('user_id', 'name email avatar')
                    .populate('course_id', 'title thumbnail')
                    .sort({ enrolled_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Enrollment.countDocuments({ course_id: { $in: courseIds }, status: 'pending' })
            ]);

            res.json({
                success: true,
                data: {
                    enrollments,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit))
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

    /** PATCH /api/instructors/dashboard/enrollments/:id/approve - Duyệt đăng ký */
    approveEnrollment: async (req, res) => {
        try {
            const enrollmentId = req.params.id;
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';

            const enrollment = await Enrollment.findById(enrollmentId).populate('course_id').lean();
            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đăng ký'
                });
            }

            // Kiểm tra quyền
            if (!isAdmin && enrollment.course_id.instructor_id.toString() !== instructorId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền duyệt đăng ký này'
                });
            }

            // Cập nhật status
            enrollment.status = 'active';
            await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'active' });

            // Tăng student_count
            await Course.findByIdAndUpdate(enrollment.course_id._id, {
                $inc: { student_count: 1 }
            });

            res.json({
                success: true,
                message: 'Duyệt đăng ký thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /** PATCH /api/instructors/dashboard/enrollments/:id/reject - Từ chối đăng ký */
    rejectEnrollment: async (req, res) => {
        try {
            const enrollmentId = req.params.id;
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';

            const enrollment = await Enrollment.findById(enrollmentId).populate('course_id').lean();
            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đăng ký'
                });
            }

            // Kiểm tra quyền
            if (!isAdmin && enrollment.course_id.instructor_id.toString() !== instructorId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền từ chối đăng ký này'
                });
            }

            // Cập nhật status
            await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'cancelled' });

            res.json({
                success: true,
                message: 'Từ chối đăng ký thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /** GET /api/instructors/dashboard/revenue - Thống kê doanh thu */
    getRevenue: async (req, res) => {
        try {
            const instructorId = req.user._id;
            const isAdmin = req.user.role === 'admin';
            const { period = 'month' } = req.query;

            const courseFilter = isAdmin ? {} : { instructor_id: instructorId };
            const courses = await Course.find(courseFilter).select('_id').lean();
            const courseIds = courses.map(c => c._id);

            if (courseIds.length === 0) {
                return res.json({
                    success: true,
                    data: { revenue: [], total: 0 }
                });
            }

            let dateFilter = {};
            const now = new Date();

            if (period === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { created_at: { $gte: weekAgo } };
            } else if (period === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { created_at: { $gte: monthAgo } };
            } else if (period === 'year') {
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { created_at: { $gte: yearAgo } };
            }

            const revenueData = await Payment.aggregate([
                { $match: { course_id: { $in: courseIds }, status: 'approved', ...dateFilter } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
                        },
                        amount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);

            res.json({
                success: true,
                data: {
                    revenue: revenueData,
                    total: totalRevenue
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

module.exports = instructorDashboardController;