const User = require('../models/user.model');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const CourseProgress = require('../models/courseProgress.model');

/**
 * GET /api/stats/public — thống kê công khai cho trang chủ (không cần đăng nhập)
 */
const getPublicStats = async (req, res) => {
    try {
        const [
            studentCount,
            courseCount,
            instructorIds,
            progressAvg,
            ratingWeighted
        ] = await Promise.all([
            User.countDocuments({ role: 'student', is_active: 1 }),
            Course.countDocuments(),
            Course.distinct('instructor_id', { instructor_id: { $ne: null } }),
            CourseProgress.aggregate([
                { $group: { _id: null, avg: { $avg: '$progress_percentage' } } }
            ]),
            Course.aggregate([
                { $match: { review_count: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        weighted: { $sum: { $multiply: ['$average_rating', '$review_count'] } },
                        reviews: { $sum: '$review_count' }
                    }
                }
            ])
        ]);

        const instructorCount = instructorIds.filter(Boolean).length;

        let completionRatePercent = 0;
        if (progressAvg.length && typeof progressAvg[0].avg === 'number') {
            completionRatePercent = Math.min(100, Math.round(progressAvg[0].avg));
        }

        let averageRating = 0;
        if (ratingWeighted.length && ratingWeighted[0].reviews > 0) {
            averageRating =
                Math.round((ratingWeighted[0].weighted / ratingWeighted[0].reviews) * 10) / 10;
        } else {
            const fallback = await Course.aggregate([
                { $match: { average_rating: { $gt: 0 } } },
                { $group: { _id: null, avg: { $avg: '$average_rating' } } }
            ]);
            if (fallback.length && typeof fallback[0].avg === 'number') {
                averageRating = Math.round(fallback[0].avg * 10) / 10;
            }
        }

        let spotlightCourse = null;
        let course = await Course.findOne({ is_published: 1 }).sort({ created_at: -1 }).lean();
        if (!course) {
            course = await Course.findOne().sort({ created_at: -1 }).lean();
        }
        if (course) {
            const lessonCount = await Lesson.countDocuments({ course_id: course._id });
            const courseProg = await CourseProgress.aggregate([
                { $match: { course_id: course._id } },
                { $group: { _id: null, avg: { $avg: '$progress_percentage' } } }
            ]);
            const avgProg =
                courseProg.length && typeof courseProg[0].avg === 'number'
                    ? Math.min(100, Math.round(courseProg[0].avg))
                    : 0;
            spotlightCourse = {
                title: course.title,
                lesson_count: lessonCount,
                progress_percent: avgProg
            };
        }

        res.json({
            success: true,
            data: {
                student_count: studentCount,
                course_count: courseCount,
                instructor_count: instructorCount,
                completion_rate_percent: completionRatePercent,
                average_rating: averageRating,
                spotlight_course: spotlightCourse
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Không lấy được thống kê'
        });
    }
};

module.exports = {
    getPublicStats
};
