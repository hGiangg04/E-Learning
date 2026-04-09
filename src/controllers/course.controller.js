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

/** Tránh CastError khi client gửi category_id: "" hoặc số dạng string */
function normalizeOptionalObjectId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return value;
    }
    return null;
}

function buildCourseUpdatePayload(body) {
    const allowed = [
        'title',
        'description',
        'slug',
        'thumbnail',
        'price',
        'discount_price',
        'discount_start',
        'discount_end',
        'duration_hours',
        'level',
        'language',
        'is_published',
        'category_id',
        'instructor_id'
    ];
    const out = {};
    for (const key of allowed) {
        if (body[key] === undefined) continue;
        if (key === 'category_id' || key === 'instructor_id') {
            out[key] = normalizeOptionalObjectId(body[key]);
            continue;
        }
        if (key === 'price' || key === 'discount_price' || key === 'duration_hours') {
            const n = body[key];
            out[key] = n === '' || n === null ? 0 : Number(n);
            continue;
        }
        if (key === 'is_published') {
            out[key] = Number(body[key]) === 1 ? 1 : 0;
            continue;
        }
        if (key === 'thumbnail') {
            out[key] = body[key] === null ? '' : String(body[key]);
            continue;
        }
        out[key] = body[key];
    }
    return out;
}

const courseController = {
    // GET /api/courses — công khai: chỉ khóa đã publish
    getAllCourses: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                category_id,
                level,
                search,
                sort = '-created_at',
                min_price,
                max_price,
                min_rating,
                language
            } = req.query;

            const query = { is_published: 1 };

            // Lọc theo danh mục
            if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
                query.category_id = category_id;
            }

            // Lọc theo cấp độ
            if (level) query.level = level;

            // Lọc theo ngôn ngữ
            if (language) query.language = language;

            // Tìm kiếm theo tiêu đề hoặc mô tả
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Lọc theo khoảng giá (dùng discount_price nếu có giảm giá, không thì dùng price)
            if (min_price !== undefined || max_price !== undefined) {
                query.$expr = {
                    $let: {
                        vars: {
                            effectivePrice: {
                                $cond: [
                                    { $and: [
                                        { $gte: ['$discount_price', 1] },
                                        { $or: [
                                            { $not: '$discount_start' },
                                            { $lte: ['$discount_start', new Date()] }
                                        ]},
                                        { $or: [
                                            { $not: '$discount_end' },
                                            { $gte: ['$discount_end', new Date()] }
                                        ]}
                                    ]},
                                    '$discount_price',
                                    '$price'
                                ]
                            }
                        },
                        in: {
                            $and: [
                                { $gte: ['$$effectivePrice', Number(min_price) || 0] },
                                { $lte: ['$$effectivePrice', Number(max_price) || 999999999] }
                            ]
                        }
                    }
                };
            }

            // Lọc theo đánh giá tối thiểu
            if (min_rating) {
                query.average_rating = { $gte: Number(min_rating) };
            }

            // Xác định sort field và direction
            let sortConfig = {};
            switch (sort) {
                case 'price_asc':
                    sortConfig = { price: 1 };
                    break;
                case 'price_desc':
                    sortConfig = { price: -1 };
                    break;
                case 'rating':
                    sortConfig = { average_rating: -1, review_count: -1 };
                    break;
                case 'students':
                    sortConfig = { student_count: -1 };
                    break;
                case 'newest':
                    sortConfig = { created_at: -1 };
                    break;
                case 'oldest':
                    sortConfig = { created_at: 1 };
                    break;
                case 'title_asc':
                    sortConfig = { title: 1 };
                    break;
                case 'title_desc':
                    sortConfig = { title: -1 };
                    break;
                default:
                    sortConfig = { created_at: -1 };
            }

            const courses = await Course.find(query)
                .populate('category_id', 'name slug')
                .populate('instructor_id', 'name avatar')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort(sortConfig);

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
                category_id: normalizeOptionalObjectId(category_id),
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
            const payload = buildCourseUpdatePayload(req.body);

            if (payload.category_id) {
                const cat = await Category.findById(payload.category_id);
                if (!cat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Danh mục không tồn tại'
                    });
                }
            }

            const course = await Course.findByIdAndUpdate(
                req.params.id,
                { ...payload, updated_at: Date.now() },
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
