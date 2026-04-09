const mongoose = require('mongoose');

const userCertificateSchema = new mongoose.Schema({
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
    certificate_number: {
        type: String,
        required: true,
        unique: true
    },
    issued_at: {
        type: Date,
        default: Date.now
    },
    expires_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'revoked'],
        default: 'active'
    }
});

// Index (certificate_number: unique đã tạo index qua field `unique: true` — không gọi thêm schema.index)
userCertificateSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
userCertificateSchema.index({ user_id: 1 });

function generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CERT-${timestamp}-${random}`;
}

// Phải dùng pre('validate'): Mongoose validate trước pre('save'), nên pre('save')
// không kịp gán certificate_number khi field đang required.
userCertificateSchema.pre('validate', function (next) {
    if (!this.certificate_number) {
        this.certificate_number = generateCertificateNumber();
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('UserCertificate', userCertificateSchema);
