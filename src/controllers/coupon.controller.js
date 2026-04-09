const mongoose = require('mongoose');
const Coupon = require('../models/coupon.model');
const Course = require('../models/course.model');

const controller = {};

controller.createCoupon = async (req, res) => {
    try {
        const { code, course_id, discount_percent, usage_limit, start_date, end_date, is_active } = req.body;

        // Kiểm tra khóa học tồn tại
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Khóa học không tồn tại'
            });
        }

        // Chuẩn hóa mã coupon thành uppercase
        const normalizedCode = code.trim().toUpperCase();

        // Kiểm tra mã coupon đã tồn tại chưa
        const existingCoupon = await Coupon.findOne({ code: normalizedCode });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã tồn tại'
            });
        }

        const coupon = await Coupon.create({
            code: normalizedCode,
            course_id,
            discount_percent,
            usage_limit: usage_limit || 1,
            used_count: 0,
            start_date: start_date || Date.now(),
            end_date: end_date,
            is_active: is_active !== undefined ? is_active : true,
            created_by: req.user._id
        });

        const populatedCoupon = await Coupon.findById(coupon._id)
            .populate('course_id', 'title slug thumbnail')
            .populate('created_by', 'name email');

        return res.status(201).json({
            success: true,
            message: 'Tạo coupon thành công',
            data: populatedCoupon
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã tồn tại'
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo coupon'
        });
    }
};

controller.getCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, course_id, is_active, sort = '-created_at' } = req.query;

        const filter = {};
        if (course_id) filter.course_id = course_id;
        if (is_active !== undefined) filter.is_active = is_active === 'true';
        if (search) {
            filter.code = { $regex: search, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [coupons, total] = await Promise.all([
            Coupon.find(filter)
                .populate('course_id', 'title slug thumbnail price')
                .populate('created_by', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Coupon.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: coupons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách coupon'
        });
    }
};

controller.getCouponById = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id)
            .populate('course_id', 'title slug thumbnail price description')
            .populate('created_by', 'name email');

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon không tồn tại'
            });
        }

        return res.status(200).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy coupon'
        });
    }
};

controller.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, course_id, discount_percent, usage_limit, start_date, end_date, is_active } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon không tồn tại'
            });
        }

        // Nếu đổi mã coupon
        if (code) {
            const normalizedCode = code.trim().toUpperCase();
            const existingCoupon = await Coupon.findOne({
                code: normalizedCode,
                _id: { $ne: id }
            });
            if (existingCoupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã coupon đã tồn tại'
                });
            }
            coupon.code = normalizedCode;
        }

        if (course_id) {
            const course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }
            coupon.course_id = course_id;
        }

        if (discount_percent !== undefined) coupon.discount_percent = discount_percent;
        if (usage_limit !== undefined) coupon.usage_limit = usage_limit;
        if (start_date !== undefined) coupon.start_date = start_date;
        if (end_date !== undefined) coupon.end_date = end_date;
        if (is_active !== undefined) coupon.is_active = is_active;

        await coupon.save();

        const updatedCoupon = await Coupon.findById(id)
            .populate('course_id', 'title slug thumbnail price')
            .populate('created_by', 'name email');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật coupon thành công',
            data: updatedCoupon
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã tồn tại'
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật coupon'
        });
    }
};

controller.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon không tồn tại'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa coupon thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa coupon'
        });
    }
};

controller.getCouponsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Kiểm tra khóa học tồn tại
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Khóa học không tồn tại'
            });
        }

        const now = Date.now();
        const coupons = await Coupon.find({
            course_id: courseId,
            is_active: true,
            used_count: { $lt: '$usage_limit' },
            start_date: { $lte: now },
            end_date: { $gte: now }
        })
            .select('code discount_percent usage_limit used_count start_date end_date')
            .sort('-created_at');

        return res.status(200).json({
            success: true,
            data: coupons
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy coupon'
        });
    }
};

controller.applyCoupon = async (req, res) => {
    try {
        const { code, course_id } = req.body;

        if (!code || !course_id) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon và khóa học là bắt buộc'
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        // Tìm coupon
        const coupon = await Coupon.findOne({ code: normalizedCode });
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Mã coupon không tồn tại'
            });
        }

        // Kiểm tra coupon có đúng khóa học không
        if (coupon.course_id.toString() !== course_id) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon không áp dụng cho khóa học này'
            });
        }

        // Kiểm tra coupon đã hết hạn chưa
        const now = Date.now();
        if (coupon.start_date > now) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon chưa có hiệu lực'
            });
        }
        if (coupon.end_date < now) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã hết hạn'
            });
        }

        // Kiểm tra coupon đã bị vô hiệu hóa chưa
        if (!coupon.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra số lượt sử dụng
        if (coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Mã coupon đã hết lượt sử dụng'
            });
        }

        // Lấy thông tin khóa học để tính giá
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Khóa học không tồn tại'
            });
        }

        const originalPrice = course.price;
        const discountAmount = coupon.calculateDiscount(originalPrice);
        const finalPrice = coupon.getFinalPrice(originalPrice);

        return res.status(200).json({
            success: true,
            message: 'Áp dụng mã giảm giá thành công',
            data: {
                coupon_code: coupon.code,
                discount_percent: coupon.discount_percent,
                discount_amount: discountAmount,
                original_price: originalPrice,
                final_price: finalPrice,
                course_id: course._id,
                course_title: course.title
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi áp dụng coupon'
        });
    }
};

controller.useCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // Atomic update: chỉ tăng used_count nếu chưa hết lượt
        const coupon = await Coupon.findOneAndUpdate(
            {
                _id: id,
                used_count: { $lt: '$usage_limit' },
                is_active: true
            },
            { $inc: { used_count: 1 } },
            { new: true }
        );

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Không thể sử dụng coupon này'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sử dụng coupon thành công',
            data: coupon
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi sử dụng coupon'
        });
    }
};

module.exports = controller;
