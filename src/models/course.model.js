const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề không được để trống'],
        trim: true,
        maxlength: [200, 'Tiêu đề không quá 200 ký tự']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    instructor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Giá không thể âm']
    },
    discount_price: {
        type: Number,
        default: 0
    },
    discount_start: {
        type: Date,
        default: null
    },
    discount_end: {
        type: Date,
        default: null
    },
    duration_hours: {
        type: Number,
        default: 0
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    language: {
        type: String,
        default: 'vi'
    },
    is_published: {
        type: Number,
        default: 0
    },
    average_rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    review_count: {
        type: Number,
        default: 0
    },
    student_count: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('Course', courseSchema);
