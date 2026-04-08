const Course = require('../models/course.model');

const courseController = {
    // GET /api/courses
    getAllCourses: async (req, res) => {
        try {
            const { page = 1, limit = 10, category_id, level, search, sort = '-created_at' } = req.query;
            
            const query = { is_published: 1 };
            if (category_id) query.category_id = category_id;
            if (level) query.level = level;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const courses = await Course.find(query)
                .populate('instructor_id', 'name avatar')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort(sort);

            const total = await Course.countDocuments(query);

            res.json({
                success: true,
                data: {
                    courses,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
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

    // GET /api/courses/:id
    getCourseById: async (req, res) => {
        try {
            const course = await Course.findById(req.params.id)
                .populate('instructor_id', 'name avatar bio');

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            res.json({
                success: true,
                data: { course }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // POST /api/courses (Instructor/Admin only)
    createCourse: async (req, res) => {
        try {
            const course = new Course({
                ...req.body,
                instructor_id: req.user._id
            });

            await course.save();

            res.status(201).json({
                success: true,
                message: 'Tạo khóa học thành công',
                data: { course }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // PUT /api/courses/:id
    updateCourse: async (req, res) => {
        try {
            const course = await Course.findByIdAndUpdate(
                req.params.id,
                { ...req.body, updated_at: Date.now() },
                { new: true, runValidators: true }
            );

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật khóa học thành công',
                data: { course }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DELETE /api/courses/:id
    deleteCourse: async (req, res) => {
        try {
            const course = await Course.findByIdAndDelete(req.params.id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            res.json({
                success: true,
                message: 'Xóa khóa học thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = courseController;
