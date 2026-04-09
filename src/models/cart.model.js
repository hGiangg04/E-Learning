const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        price_at_add: {
            type: Number,
            default: 0
        },
        added_at: {
            type: Date,
            default: Date.now
        }
    }],
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Index
cartSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);
