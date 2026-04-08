const mongoose = require('mongoose');
const Course = require('../models/course.model');
const Category = require('../models/category.model');

function buildSlug(title) {
    const base = String(title || 'course')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${base || 'course'}-${Date.now()}`;
}

const courseController = {
    // GET /api/courses — công khai: chỉ khóa đã publish
    getAllCourses: async (req, res) => {
        try {
            const { page = 1, limit = 10, category_id, level, search, sort = '-created_at' } = req.query;

            const query = { is_published: 1 };
            if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
                query.category_id = category_id;
            }
            if (level) query.level = level;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const courses = await Course.find(query)
                .populate('category_id', 'name slug')
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

    // GET /api/courses/admin/all — admin: tất cả khóa (nháp + đã publish)
    listAllForAdmin: async (req, res) => {
        try {
            const { page = 1, limit = 20, category_id, search, is_published } = req.query;
            const query = {};
            if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
                query.category_id = category_id;
            }
            if (is_published !== undefined) query.is_published = Number(is_published);
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const courses = await Course.find(query)
                .populate('category_id', 'name')
                .populate('instructor_id', 'name email')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ updated_at: -1 });

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
                .populate('category_id', 'name description')
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

    // POST /api/courses — admin; thumbnail: URL hoặc chuỗi base64
    createCourse: async (req, res) => {
        try {
            const { category_id, title, slug, thumbnail, ...rest } = req.body;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'title là bắt buộc'
                });
            }

            if (category_id) {
                if (!mongoose.Types.ObjectId.isValid(category_id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'category_id không hợp lệ'
                    });
                }
                const cat = await Category.findById(category_id);
                if (!cat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Danh mục không tồn tại'
                    });
                }
            }

            const course = new Course({
                title,
                slug: slug || buildSlug(title),
                thumbnail: thumbnail !== undefined ? thumbnail : '',
                category_id: category_id || null,
                instructor_id: req.user._id,
                ...rest
            });

            await course.save();

            const populated = await Course.findById(course._id)
                .populate('category_id', 'name')
                .populate('instructor_id', 'name avatar');

            res.status(201).json({
                success: true,
                message: 'Tạo khóa học thành công',
                data: { course: populated }
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
            if (req.body.category_id) {
                if (!mongoose.Types.ObjectId.isValid(req.body.category_id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'category_id không hợp lệ'
                    });
                }
                const cat = await Category.findById(req.body.category_id);
                if (!cat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Danh mục không tồn tại'
                    });
                }
            }

            const course = await Course.findByIdAndUpdate(
                req.params.id,
                { ...req.body, updated_at: Date.now() },
                { new: true, runValidators: true }
            )
                .populate('category_id', 'name')
                .populate('instructor_id', 'name avatar');

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
