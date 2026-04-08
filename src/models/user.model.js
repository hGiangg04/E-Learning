const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên không được để trống'],
        trim: true,
        maxlength: [100, 'Tên không quá 100 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email không được để trống'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        default: null   // null = đăng nhập bằng Google (không có mật khẩu)
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        default: 'student'
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    is_active: {
        type: Number,
        default: 1
    },

    // ---- Google OAuth ----
    google_id: {
        type: String,
        default: null
    },

    // ---- Quên mật khẩu ----
    reset_token: {
        type: String,
        default: null
    },
    reset_token_expires: {
        type: Date,
        default: null
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

// Hash password khi password bị thay đổi
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// So sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual: public profile
userSchema.virtual('profile').get(function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        avatar: this.avatar,
        is_active: this.is_active
    };
});

module.exports = mongoose.model('User', userSchema);
