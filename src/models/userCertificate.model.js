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

// Index
userCertificateSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
userCertificateSchema.index({ certificate_number: 1 }, { unique: true });
userCertificateSchema.index({ user_id: 1 });

// Tạo certificate_number tự động trước khi lưu
userCertificateSchema.pre('save', async function (next) {
    if (!this.certificate_number) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.certificate_number = `CERT-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('UserCertificate', userCertificateSchema);
