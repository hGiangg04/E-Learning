const mongoose = require('mongoose');
const CourseProgress = require('../models/courseProgress.model');
const Lesson = require('../models/lesson.model');

/** Script seed dùng `course_progress`; Mongoose lưu `courseprogresses` — chọn collection đang có dữ liệu. */
async function resolveProgressCollection(db) {
    const candidates = [CourseProgress.collection.name, 'course_progress'];
    let best = db.collection(candidates[0]);
    let bestCount = await best.estimatedDocumentCount();
    for (let i = 1; i < candidates.length; i += 1) {
        const col = db.collection(candidates[i]);
        const n = await col.estimatedDocumentCount();
        if (n > bestCount) {
            bestCount = n;
            best = col;
        }
    }
    return best;
}

/**
 * Đếm trực tiếp trên collection MongoDB (trùng Compass / shell) để tránh lệch DB hoặc lệch schema.
 * GET /api/stats/public — thống kê công khai cho trang chủ (không cần đăng nhập)
 */
const getPublicStats = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(503).json({
                success: false,
                message: 'Database chưa kết nối'
            });
        }

        const usersCol = db.collection('users');
        const coursesCol = db.collection('courses');
        const progressCol = await resolveProgressCollection(db);
        const lessonsCol = db.collection(Lesson.collection.name);

        const [
            studentCount,
            courseCount,
            instructorIds,
            progressAvg,
            ratingWeighted
        ] = await Promise.all([
            usersCol.countDocuments({
                role: 'student',
                $or: [{ is_active: 1 }, { is_active: true }, { is_active: { $exists: false } }]
            }),
            coursesCol.countDocuments(),
            coursesCol.distinct('instructor_id', { instructor_id: { $ne: null } }),
            progressCol
                .aggregate([{ $group: { _id: null, avg: { $avg: '$progress_percentage' } } }])
                .toArray(),
            coursesCol
                .aggregate([
                    { $match: { review_count: { $gt: 0 } } },
                    {
                        $group: {
                            _id: null,
                            weighted: { $sum: { $multiply: ['$average_rating', '$review_count'] } },
                            reviews: { $sum: '$review_count' }
                        }
                    }
                ])
                .toArray()
        ]);

        const instructorCount = instructorIds.filter(Boolean).length;

        let completionRatePercent = 0;
        if (progressAvg.length && typeof progressAvg[0].avg === 'number' && !Number.isNaN(progressAvg[0].avg)) {
            completionRatePercent = Math.min(100, Math.round(progressAvg[0].avg));
        }

        let averageRating = 0;
        if (ratingWeighted.length && ratingWeighted[0].reviews > 0) {
            averageRating =
                Math.round((ratingWeighted[0].weighted / ratingWeighted[0].reviews) * 10) / 10;
        } else {
            const fallback = await coursesCol
                .aggregate([
                    { $match: { average_rating: { $gt: 0 } } },
                    { $group: { _id: null, avg: { $avg: '$average_rating' } } }
                ])
                .toArray();
            if (fallback.length && typeof fallback[0].avg === 'number') {
                averageRating = Math.round(fallback[0].avg * 10) / 10;
            }
        }

        let spotlightCourse = null;
        let courseDocs = await coursesCol.find({ is_published: 1 }).sort({ created_at: -1 }).limit(1).toArray();
        if (!courseDocs.length) {
            courseDocs = await coursesCol.find({}).sort({ created_at: -1 }).limit(1).toArray();
        }
        if (courseDocs.length) {
            const c = courseDocs[0];
            const lessonCount = await lessonsCol.countDocuments({ course_id: c._id });
            const courseProg = await progressCol
                .aggregate([
                    { $match: { course_id: c._id } },
                    { $group: { _id: null, avg: { $avg: '$progress_percentage' } } }
                ])
                .toArray();
            const avgProg =
                courseProg.length && typeof courseProg[0].avg === 'number'
                    ? Math.min(100, Math.round(courseProg[0].avg))
                    : 0;
            spotlightCourse = {
                title: c.title,
                lesson_count: lessonCount,
                progress_percent: avgProg
            };
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
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
