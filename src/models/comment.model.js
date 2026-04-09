const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target_type: { type: String, enum: ['course', 'lesson'], required: true },
    target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: { type: String, required: true, trim: true, maxLength: 2000 },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    is_active: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

commentSchema.index({ target_type: 1, target_id: 1, created_at: -1 });
commentSchema.index({ parent_id: 1, created_at: 1 });

module.exports = mongoose.model('Comment', commentSchema);
