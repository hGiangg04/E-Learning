const mongoose = require('mongoose');
const Lesson = require('../models/lesson.model');
const Course = require('../models/course.model');

const lessonController = {
    // GET /api/lessons/course/:courseId — sắp xếp theo position
    getLessonsByCourse: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'courseId không hợp lệ'
                });
            }

            const lessons = await Lesson.find({
                course_id: req.params.courseId,
                is_published: 1
            })
                .sort({ position: 1 })
                .select('-content');

            res.json({
                success: true,
                data: { lessons }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/lessons/:id
    getLessonById: async (req, res) => {
        try {
            const lesson = await Lesson.findById(req.params.id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }

            res.json({
                success: true,
                data: { lesson }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/lessons — admin: course_id, title, content, video_url, position
    createLesson: async (req, res) => {
        try {
            const { course_id, title, position } = req.body;
            if (!course_id || !title) {
                return res.status(400).json({
                    success: false,
                    message: 'course_id và title là bắt buộc'
                });
            }
            if (!mongoose.Types.ObjectId.isValid(course_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'course_id không hợp lệ'
                });
            }

            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            let pos = position;
            if (pos === undefined || pos === null) {
                const last = await Lesson.findOne({ course_id }).sort({ position: -1 });
                pos = last ? last.position + 1 : 1;
            }

            const lesson = new Lesson({ ...req.body, course_id, position: pos });
            await lesson.save();

            res.status(201).json({
                success: true,
                message: 'Tạo bài học thành công',
                data: { lesson }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PUT /api/lessons/:id — đổi thứ tự: gửi position mới
    updateLesson: async (req, res) => {
        try {
            const lesson = await Lesson.findByIdAndUpdate(
                req.params.id,
                { ...req.body, updated_at: Date.now() },
                { new: true, runValidators: true }
            );

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật bài học thành công',
                data: { lesson }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DELETE /api/lessons/:id
    deleteLesson: async (req, res) => {
        try {
            const lesson = await Lesson.findByIdAndDelete(req.params.id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Xóa bài học thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = lessonController;
