const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Vui lòng chọn số sao đánh giá'],
        min: [1, 'Số sao tối thiểu là 1'],
        max: [5, 'Số sao tối đa là 5']
    },
    comment: {
        type: String,
        default: '',
        maxlength: [2000, 'Bình luận không quá 2000 ký tự']
    },
    is_visible: {
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

// Index
courseReviewSchema.index({ user_id: 1, course_id: 1 });
courseReviewSchema.index({ course_id: 1, created_at: -1 });

module.exports = mongoose.model('CourseReview', courseReviewSchema);
