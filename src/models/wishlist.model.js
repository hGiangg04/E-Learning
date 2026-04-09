const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
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
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Index để tránh trùng lặp
wishlistSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
