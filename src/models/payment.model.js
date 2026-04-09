const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
    enrollment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
        default: null
    },
    order_code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    coupon_code: {
        type: String,
        default: null,
        trim: true
    },
    discount_percent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discount_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    original_amount: {
        type: Number,
        default: null,
        min: 0
    },
    payment_method: {
        type: String,
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    auto_processed: {
        type: Number,
        default: 0
    },
    paid_at: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

paymentSchema.index({ user_id: 1, course_id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
