const CourseReview = require('../models/courseReview.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

// Lấy reviews theo khóa học (public)
exports.getReviewsByCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await CourseReview.find({ course_id, is_visible: 1 })
            .populate('user_id', 'name avatar')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await CourseReview.countDocuments({ course_id, is_visible: 1 });

        // Tính trung bình
        const stats = await CourseReview.aggregate([
            { $match: { course_id: new mongoose.Types.ObjectId(course_id), is_visible: 1 } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                stats: stats[0] || { averageRating: 0, totalReviews: 0 }
            }
        });
    } catch (error) {
        console.error('Lỗi getReviewsByCourse:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy review của user hiện tại cho khóa học
exports.getMyReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;

        const review = await CourseReview.findOne({ user_id: userId, course_id });
        res.json({
            success: true,
            data: { review }
        });
    } catch (error) {
        console.error('Lỗi getMyReview:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Tạo mới review
exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id, rating, comment } = req.body;

        if (!course_id || !rating) {
            return res.status(400).json({ success: false, message: 'course_id và rating là bắt buộc' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating phải từ 1 đến 5' });
        }

        // Kiểm tra khóa học có tồn tại không
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra user đã đăng ký khóa học chưa
        const enrollment = await Enrollment.findOne({
            user_id: userId,
            course_id,
            status: 'active'
        });
        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'Bạn cần đăng ký khóa học trước khi đánh giá' });
        }

        // Kiểm tra đã review chưa
        const existing = await CourseReview.findOne({ user_id: userId, course_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá khóa học này rồi' });
        }

        const review = new CourseReview({
            user_id: userId,
            course_id,
            rating,
            comment: comment || ''
        });
        await review.save();

        // Cập nhật average_rating và review_count của course
        await updateCourseRating(course_id);

        res.status(201).json({
            success: true,
            message: 'Cảm ơn bạn đã đánh giá!',
            data: { review }
        });
    } catch (error) {
        console.error('Lỗi createReview:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Cập nhật review
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;
        const { rating, comment } = req.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ success: false, message: 'Rating phải từ 1 đến 5' });
        }

        const review = await CourseReview.findOneAndUpdate(
            { user_id: userId, course_id },
            {
                ...(rating !== undefined && { rating }),
                ...(comment !== undefined && { comment }),
                updated_at: new Date()
            },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá của bạn' });
        }

        // Cập nhật average_rating của course
        await updateCourseRating(course_id);

        res.json({
            success: true,
            message: 'Đã cập nhật đánh giá',
            data: { review }
        });
    } catch (error) {
        console.error('Lỗi updateReview:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa review
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;

        const deleted = await CourseReview.findOneAndDelete({ user_id: userId, course_id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }

        await updateCourseRating(course_id);

        res.json({
            success: true,
            message: 'Đã xóa đánh giá'
        });
    } catch (error) {
        console.error('Lỗi deleteReview:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Hàm helper: cập nhật average_rating của course
async function updateCourseRating(courseId) {
    try {
        const mongoose = require('mongoose');
        const stats = await CourseReview.aggregate([
            { $match: { course_id: new mongoose.Types.ObjectId(courseId), is_visible: 1 } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        await Course.findByIdAndUpdate(courseId, {
            average_rating: stats[0] ? Math.round(stats[0].averageRating * 10) / 10 : 0,
            review_count: stats[0] ? stats[0].totalReviews : 0
        });
    } catch (error) {
        console.error('Lỗi updateCourseRating:', error);
    }
}
