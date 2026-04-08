const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    title: {
        type: String,
        required: [true, 'Tiêu đề bài học không được để trống'],
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    /** Mục tiêu bài học (HTML hoặc văn bản) — hiển thị riêng trên trang học */
    objectives: {
        type: String,
        default: ''
    },
    /** Ảnh minh họa / banner bài học (URL hoặc base64) */
    cover_image: {
        type: String,
        default: ''
    },
    video_url: {
        type: String,
        default: ''
    },
    video_duration: {
        type: Number,
        default: 0
    },
    position: {
        type: Number,
        default: 0
    },
    is_free: {
        type: Number,
        default: 0
    },
    is_published: {
        type: Number,
        default: 1
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lesson', lessonSchema);
