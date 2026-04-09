const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: [true, 'Câu hỏi là bắt buộc']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người trả lời là bắt buộc']
    },
    content: {
        type: String,
        required: [true, 'Nội dung câu trả lời là bắt buộc'],
        maxlength: [5000, 'Nội dung không quá 5000 ký tự']
    },
    is_instructor: {
        type: Boolean,
        default: false
    },
    upvotes: {
        type: Number,
        default: 0
    },
    upvoted_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Index cho truy vấn nhanh
answerSchema.index({ question_id: 1, created_at: 1 });
answerSchema.index({ user_id: 1 });
answerSchema.index({ upvotes: -1 });

// Virtual: lấy thông tin người trả lời
answerSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

answerSchema.set('toJSON', { virtuals: true });
answerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Answer', answerSchema);
