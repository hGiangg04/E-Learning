const mongoose = require('mongoose');
const Lesson = require('../models/lesson.model');
const LessonProgress = require('../models/lessonProgress.model');
const CourseProgress = require('../models/courseProgress.model');

/**
 * Tính lại tiến độ khóa từ LessonProgress (bài đã xuất bản).
 */
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

module.exports = { syncCourseProgress };
