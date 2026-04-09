const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Mã coupon không được để trống'],
        trim: true,
        uppercase: true,
        minlength: [4, 'Mã coupon phải có ít nhất 4 ký tự'],
        maxlength: [20, 'Mã coupon không quá 20 ký tự']
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Khóa học áp dụng không được để trống']
    },
    discount_percent: {
        type: Number,
        required: [true, 'Phần trăm giảm giá không được để trống'],
        min: [1, 'Phần trăm giảm giá phải từ 1%'],
        max: [100, 'Phần trăm giảm giá không quá 100%']
    },
    usage_limit: {
        type: Number,
        required: [true, 'Số lượt sử dụng không được để trống'],
        min: [1, 'Số lượt sử dụng phải từ 1'],
        default: 1
    },
    used_count: {
        type: Number,
        default: 0,
        min: 0
    },
    start_date: {
        type: Date,
        required: [true, 'Ngày bắt đầu không được để trống'],
        default: Date.now
    },
    end_date: {
        type: Date,
        required: [true, 'Ngày kết thúc không được để trống'],
        default: function() {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ course_id: 1 });
couponSchema.index({ is_active: 1 });
couponSchema.index({ course_id: 1, is_active: 1 });

couponSchema.pre('validate', function () {
    if (this.start_date && this.end_date && this.start_date >= this.end_date) {
        this.invalidate('end_date', 'Ngày kết thúc phải sau ngày bắt đầu');
    }
});

couponSchema.methods.isValid = function() {
    const now = Date.now();
    return this.is_active &&
           this.used_count < this.usage_limit &&
           this.start_date <= now &&
           this.end_date >= now;
};

couponSchema.methods.calculateDiscount = function(originalPrice) {
    if (!this.isValid()) return 0;
    return Math.round(originalPrice * (this.discount_percent / 100));
};

couponSchema.methods.getFinalPrice = function(originalPrice) {
    const discount = this.calculateDiscount(originalPrice);
    return Math.max(0, originalPrice - discount);
};

module.exports = mongoose.model('Coupon', couponSchema);
