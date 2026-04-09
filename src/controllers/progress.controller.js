const mongoose = require('mongoose');
const Lesson = require('../models/lesson.model');
const LessonProgress = require('../models/lessonProgress.model');
const CourseProgress = require('../models/courseProgress.model');
const Enrollment = require('../models/enrollment.model');
const certificateController = require('./certificate.controller');
const { resolveCourseByParam } = require('../utils/resolveCourseByParam');

async function syncCourseProgress(userId, courseId) {
    const totalLessons = await Lesson.countDocuments({ course_id: courseId, is_published: 1 });
    const completedRows = await LessonProgress.countDocuments({
        user_id: userId,
        course_id: courseId,
        is_completed: 1
    });

    const agg = await LessonProgress.aggregate([
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                course_id: new mongoose.Types.ObjectId(courseId)
            }
        },
        { $group: { _id: null, totalTime: { $sum: '$time_spent' } } }
    ]);
    const totalTimeSpent = agg[0] ? agg[0].totalTime : 0;

    const progress_percentage =
        totalLessons > 0 ? Math.round((completedRows / totalLessons) * 100) : 0;

    const completed_at =
        totalLessons > 0 && completedRows >= totalLessons ? new Date() : null;

    await CourseProgress.findOneAndUpdate(
        { user_id: userId, course_id: courseId },
        {
            total_lessons: totalLessons,
            lessons_completed: completedRows,
            progress_percentage,
            total_time_spent: totalTimeSpent,
            last_accessed_at: new Date(),
            completed_at
        },
        { upsert: true, new: true }
    );
}

const progressController = {
    // PATCH /api/progress/lessons/:lessonId — cập nhật tiến độ bài học
    updateLessonProgress: async (req, res) => {
        try {
            const { lessonId } = req.params;
            const { progress_percentage, time_spent, is_completed } = req.body;

            if (!mongoose.Types.ObjectId.isValid(lessonId)) {
                return res.status(400).json({ success: false, message: 'lessonId không hợp lệ' });
            }

            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({ success: false, message: 'Bài học không tồn tại' });
            }

            const courseId = lesson.course_id;
            const enroll = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: courseId,
                status: 'active'
            });
            if (!enroll && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn cần đăng ký và được kích hoạt khóa học này'
                });
            }

            const pct = Math.min(100, Math.max(0, Number(progress_percentage) || 0));
            const done = is_completed === 1 || is_completed === true || pct >= 100 ? 1 : 0;

            const prev = await LessonProgress.findOne({
                user_id: req.user._id,
                lesson_id: lessonId
            });
            const addSeconds = Number(time_spent) || 0;
            const totalTime = (prev?.time_spent || 0) + addSeconds;

            const doc = await LessonProgress.findOneAndUpdate(
                { user_id: req.user._id, lesson_id: lessonId },
                {
                    user_id: req.user._id,
                    lesson_id: lessonId,
                    course_id: courseId,
                    progress_percentage: done ? 100 : pct,
                    time_spent: totalTime,
                    is_completed: done,
                    last_accessed_at: new Date(),
                    completed_at: done ? new Date() : null
                },
                { upsert: true, new: true }
            );

            await syncCourseProgress(req.user._id, courseId);

            const courseProgress = await CourseProgress.findOne({
                user_id: req.user._id,
                course_id: courseId
            });

            let certificateIssued = null;
            if (courseProgress && Number(courseProgress.progress_percentage) >= 100) {
                const { certificate, newlyIssued } =
                    await certificateController.tryIssueCertificateForCompletedCourse(req.user._id, courseId);
                if (certificate) {
                    certificateIssued = {
                        certificate_number: certificate.certificate_number,
                        newly_issued: newlyIssued
                    };
                }
            }

            res.json({
                success: true,
                message: 'Đã cập nhật tiến độ',
                data: {
                    lesson_progress: doc,
                    course_progress: courseProgress,
                    ...(certificateIssued ? { certificate_issued: certificateIssued } : {})
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // GET /api/progress/courses/:courseId/lessons
    getLessonProgressByCourse: async (req, res) => {
        try {
            const { courseId: raw } = req.params;
            const course = await resolveCourseByParam(raw);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
            }
            const courseId = course._id;

            const rows = await LessonProgress.find({
                user_id: req.user._id,
                course_id: courseId
            }).sort({ last_accessed_at: -1 });

            res.json({
                success: true,
                data: { lesson_progress: rows }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // GET /api/progress/courses/:courseId
    getCourseProgress: async (req, res) => {
        try {
            const { courseId: raw } = req.params;
            const course = await resolveCourseByParam(raw);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
            }
            const courseId = course._id;

            let row = await CourseProgress.findOne({
                user_id: req.user._id,
                course_id: courseId
            });

            if (!row) {
                await syncCourseProgress(req.user._id, courseId);
                row = await CourseProgress.findOne({
                    user_id: req.user._id,
                    course_id: courseId
                });
            }

            res.json({
                success: true,
                data: { course_progress: row }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = progressController;
