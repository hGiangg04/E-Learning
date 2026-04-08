const Lesson = require('../models/lesson.model');

const lessonController = {
    // GET /api/lessons/course/:courseId
    getLessonsByCourse: async (req, res) => {
        try {
            const lessons = await Lesson.find({ 
                course_id: req.params.courseId,
                is_published: 1
            }).sort({ position: 1 });

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

    // POST /api/lessons
    createLesson: async (req, res) => {
        try {
            const lesson = new Lesson(req.body);
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

    // PUT /api/lessons/:id
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
