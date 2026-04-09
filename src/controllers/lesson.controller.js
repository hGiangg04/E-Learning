const mongoose = require('mongoose');
const Lesson = require('../models/lesson.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const Payment = require('../models/payment.model');
const { resolveCourseByParam } = require('../utils/resolveCourseByParam');
const { activateEnrollmentFromPayment } = require('../utils/activateEnrollmentFromPayment');

/**
 * Lấy collection native (bypass Mongoose schema) để đọc/ghi trực tiếp.
 * Cần thiết vì một số document cũ được insert không qua Mongoose,
 * dẫn đến _id / course_id có thể không đúng kiểu ObjectId mà Mongoose mong đợi.
 */
function getLessonCollection() {
    return mongoose.connection.db.collection('lessons');
}

const LESSON_WRITABLE_FIELDS = [
    'title',
    'content',
    'objectives',
    'video_url',
    'video_duration',
    'position',
    'is_free',
    'is_published',
    'course_id'
];

function pickLessonPayload(body) {
    const out = {};
    for (const key of LESSON_WRITABLE_FIELDS) {
        if (body[key] === undefined) continue;
        if (key === 'title') {
            out[key] = body[key] == null ? '' : String(body[key]).trim();
            continue;
        }
        if (key === 'video_duration' || key === 'position' || key === 'is_free' || key === 'is_published') {
            const n = body[key];
            if (key === 'is_free' || key === 'is_published') {
                out[key] = Number(n) === 1 ? 1 : 0;
            } else {
                out[key] = n === '' || n === null ? 0 : Number(n);
            }
            continue;
        }
        if (key === 'objectives' || key === 'content') {
            out[key] = body[key] == null ? '' : String(body[key]);
            continue;
        }
        out[key] = body[key];
    }
    return out;
}

const lessonController = {
    // GET /api/lessons/admin/course/:courseId — admin: đủ trường (có content) để sửa form
    listLessonsForAdmin: async (req, res) => {
        try {
            const { courseId: raw } = req.params;
            const course = await resolveCourseByParam(raw);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            const lessons = await Lesson.find({ course_id: course._id }).sort({ position: 1 });

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

    // GET /api/lessons/course/:courseId — sắp xếp theo position
    // ?admin=1 → admin: trả đủ trường (content/objectives/cover), không lọc is_published
    // không có admin → chỉ trả list ngắn gọn (không content/objectives), chỉ bài published
    getLessonsByCourse: async (req, res) => {
        try {
            const course = await resolveCourseByParam(req.params.courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            const isAdmin = req.query.admin === '1';
            console.log('[GET /lessons/course/' + req.params.courseId + '] isAdmin=', isAdmin);

            let query = { course_id: course._id };
            if (!isAdmin) {
                query.is_published = 1;
            }

            let dbQuery = Lesson.find(query).sort({ position: 1 });
            if (!isAdmin) {
                dbQuery = dbQuery.select('-content -objectives');
            }

            const lessons = await dbQuery;
            console.log('[GET] trả về', lessons.length, 'bài, trường objectives đầu tiên:', JSON.stringify(lessons[0]?.objectives));

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

    // GET /api/lessons/:id — cần đăng nhập; nội dung đầy đủ chỉ khi đã ghi danh active, admin, hoặc bài miễn phí
    getLessonById: async (req, res) => {
        try {
            const lesson = await Lesson.findById(req.params.id);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }

            const courseId = lesson.course_id;

            if (req.user.role === 'admin') {
                return res.json({
                    success: true,
                    data: { lesson }
                });
            }

            if (Number(lesson.is_free) === 1) {
                return res.json({
                    success: true,
                    data: { lesson }
                });
            }

            let enrollment = await Enrollment.findOne({
                user_id: req.user._id,
                course_id: courseId,
                status: 'active'
            });

            if (!enrollment) {
                const completedPay = await Payment.findOne({
                    user_id: req.user._id,
                    course_id: courseId,
                    status: 'completed'
                });
                if (completedPay) {
                    await activateEnrollmentFromPayment(completedPay);
                    enrollment = await Enrollment.findOne({
                        user_id: req.user._id,
                        course_id: courseId,
                        status: 'active'
                    });
                }
            }

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message:
                        'Bạn cần ghi danh và được kích hoạt khóa học (trạng thái active) để xem bài học này'
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
            const payload = pickLessonPayload(req.body);
            const { course_id, title } = payload;
            if (!course_id || !title || !String(title).trim()) {
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

            let pos = payload.position;
            if (pos === undefined || pos === null || Number(pos) === 0) {
                const last = await Lesson.findOne({ course_id }).sort({ position: -1 });
                pos = last ? last.position + 1 : 1;
            }

            const lesson = new Lesson({ ...payload, course_id, position: pos });
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

    // PUT /api/lessons/:id — dùng native MongoDB collection (bypass Mongoose schema)
    updateLesson: async (req, res) => {
        try {
            const payload = pickLessonPayload(req.body);
            if (payload.course_id && !mongoose.Types.ObjectId.isValid(payload.course_id)) {
                delete payload.course_id;
            }

            // _id trong DB là ObjectId — phải convert chuỗi thành ObjectId để query khớp
            const filter = { _id: new mongoose.Types.ObjectId(req.params.id) };
            const updateDoc = {
                $set: {
                    title:          payload.title,
                    content:        payload.content,
                    objectives:     payload.objectives,
                    video_url:      payload.video_url,
                    video_duration: payload.video_duration,
                    position:       payload.position,
                    is_free:        payload.is_free,
                    is_published:   payload.is_published,
                    updated_at:     new Date(),
                }
            };

            const col = getLessonCollection();
            const result = await col.updateOne(filter, updateDoc);

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bài học không tồn tại'
                });
            }

            const updated = await col.findOne(filter);

            res.json({
                success: true,
                message: 'Cập nhật bài học thành công',
                data: { lesson: updated }
            });
        } catch (error) {
            console.error('[PUT /lessons/:id] LỖI:', error.message);
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
