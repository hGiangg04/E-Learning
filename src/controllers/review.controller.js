const Review = require('../models/review.model');
const Course = require('../models/course.model');

const reviewController = {
    /** POST /api/reviews — học viên đã ghi danh tạo / cập nhật đánh giá */
    createOrUpdate: async (req, res) => {
        try {
            const { course_id, rating, comment } = req.body;

            if (!course_id || !mongoose.Types.ObjectId.isValid(course_id)) {
                return res.status(400).json({ success: false, message: 'course_id không hợp lệ' });
            }
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: 'rating phải từ 1 đến 5' });
            }

            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
            }

            const existing = await Review.findOne({
                user_id: req.user._id,
                course_id
            });

            let review;
            if (existing) {
                existing.rating = Number(rating);
                existing.comment = String(comment || '').trim();
                review = await existing.save();
            } else {
                review = await Review.create({
                    user_id: req.user._id,
                    course_id,
                    rating: Number(rating),
                    comment: String(comment || '').trim()
                });
            }

            // Tính lại average_rating + review_count cho khóa học
            await recalcCourseStats(course_id);

            res.status(201).json({
                success: true,
                message: existing ? 'Cập nhật đánh giá thành công' : 'Đánh giá thành công',
                data: { review }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** GET /api/reviews/course/:courseId — lấy danh sách đánh giá công khai */
    getByCourse: async (req, res) => {
        try {
            const { courseId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({ success: false, message: 'courseId không hợp lệ' });
            }

            const [reviews, total] = await Promise.all([
                Review.find({ course_id: courseId, is_active: 1 })
                    .populate('user_id', 'name avatar')
                    .sort({ created_at: -1 })
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit)),
                Review.countDocuments({ course_id: courseId, is_active: 1 })
            ]);

            const agg = await Review.aggregate([
                { $match: { course_id: new mongoose.Types.ObjectId(courseId), is_active: 1 } },
                { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
            ]);
            const avgRating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
            const count = agg[0] ? agg[0].cnt : 0;

            res.json({
                success: true,
                data: {
                    reviews,
                    stats: { average_rating: avgRating, review_count: count },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** GET /api/reviews/my — học viên xem đánh giá của mình */
    getMyReview: async (req, res) => {
        try {
            const { courseId } = req.query;
            const query = { user_id: req.user._id };
            if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
                query.course_id = courseId;
            }
            const reviews = await Review.find(query)
                .populate('course_id', 'title')
                .sort({ created_at: -1 });
            res.json({ success: true, data: { reviews } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /** DELETE /api/reviews/:id — học viên xóa đánh giá của mình */
    deleteReview: async (req, res) => {
        try {
            const review = await Review.findOne({
                _id: req.params.id,
                user_id: req.user._id
            });
            if (!review) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
            }
            const courseId = review.course_id;
            await review.deleteOne();
            await recalcCourseStats(courseId);
            res.json({ success: true, message: 'Đã xóa đánh giá' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

async function recalcCourseStats(courseId) {
    const agg = await Review.aggregate([
        { $match: { course_id: new mongoose.Types.ObjectId(courseId), is_active: 1 } },
        { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
    ]);
    await Course.findByIdAndUpdate(courseId, {
        average_rating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
        review_count: agg[0] ? agg[0].cnt : 0,
        updated_at: Date.now()
    });
}

module.exports = reviewController;
