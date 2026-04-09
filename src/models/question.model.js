const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Khóa học là bắt buộc']
    },
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        default: null
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người hỏi là bắt buộc']
    },
    title: {
        type: String,
        required: [true, 'Tiêu đề câu hỏi là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không quá 200 ký tự']
    },
    content: {
        type: String,
        required: [true, 'Nội dung câu hỏi là bắt buộc'],
        maxlength: [5000, 'Nội dung không quá 5000 ký tự']
    },
    is_resolved: {
        type: Boolean,
        default: false
    },
    is_pinned: {
        type: Boolean,
        default: false
    },
    answer_count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Index cho truy vấn nhanh
questionSchema.index({ course_id: 1, created_at: -1 });
questionSchema.index({ lesson_id: 1, created_at: -1 });
questionSchema.index({ user_id: 1 });
questionSchema.index({ is_resolved: 1 });

// Virtual: lấy danh sách câu trả lời
questionSchema.virtual('answers', {
    ref: 'Answer',
    localField: '_id',
    foreignField: 'question_id'
});

// Virtual: lấy thông tin người hỏi
questionSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);
