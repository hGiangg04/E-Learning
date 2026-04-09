const Cart = require('../models/cart.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const Payment = require('../models/payment.model');

// Lấy giỏ hàng của user
exports.getMyCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ user_id: userId })
            .populate({
                path: 'items.course_id',
                select: 'title thumbnail price discount_price instructor_id category_id average_rating',
                populate: [
                    { path: 'instructor_id', select: 'name' }
                ]
            });

        const items = cart ? cart.items.filter(i => i.course_id).map(i => ({
            _id: i._id,
            course: i.course_id,
            price_at_add: i.price_at_add,
            added_at: i.added_at
        })) : [];

        const total = items.reduce((sum, item) => {
            const price = item.course.discount_price > 0 ? item.course.discount_price : item.course.price;
            return sum + (price > 0 ? price : 0);
        }, 0);

        res.json({
            success: true,
            data: {
                items,
                total,
                item_count: items.length
            }
        });
    } catch (error) {
        console.error('Lỗi getMyCart:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Thêm khóa học vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'course_id là bắt buộc' });
        }

        // Kiểm tra khóa học tồn tại
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra đã đăng ký chưa
        const enrollment = await Enrollment.findOne({ user_id: userId, course_id });
        if (enrollment) {
            return res.status(400).json({ success: false, message: 'Bạn đã đăng ký khóa học này' });
        }

        // Kiểm tra đã có trong giỏ hàng chưa
        let cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            cart = new Cart({ user_id: userId, items: [] });
        }

        const alreadyInCart = cart.items.some(i => String(i.course_id) === String(course_id));
        if (alreadyInCart) {
            return res.status(400).json({ success: false, message: 'Khóa học đã có trong giỏ hàng' });
        }

        cart.items.push({
            course_id,
            price_at_add: course.discount_price > 0 ? course.discount_price : course.price
        });
        cart.updated_at = new Date();
        await cart.save();

        res.status(201).json({
            success: true,
            message: 'Đã thêm vào giỏ hàng',
            data: { item_count: cart.items.length }
        });
    } catch (error) {
        console.error('Lỗi addToCart:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa khóa học khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;

        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
        }

        cart.items = cart.items.filter(i => String(i.course_id) !== String(course_id));
        cart.updated_at = new Date();
        await cart.save();

        res.json({
            success: true,
            message: 'Đã xóa khỏi giỏ hàng',
            data: { item_count: cart.items.length }
        });
    } catch (error) {
        console.error('Lỗi removeFromCart:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa tất cả giỏ hàng
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.findOneAndDelete({ user_id: userId });

        res.json({ success: true, message: 'Đã xóa giỏ hàng' });
    } catch (error) {
        console.error('Lỗi clearCart:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Checkout - tạo payment
exports.checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { payment_method = 'banking' } = req.body;

        const cart = await Cart.findOne({ user_id: userId })
            .populate({
                path: 'items.course_id',
                select: 'title price discount_price'
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
        }

        // Tính tổng tiền
        const totalAmount = cart.items.reduce((sum, item) => {
            const course = item.course_id;
            if (!course) return sum;
            const price = course.discount_price > 0 ? course.discount_price : course.price;
            return sum + (price > 0 ? price : 0);
        }, 0);

        // Tạo payment record
        const payment = new Payment({
            user_id: userId,
            course_id: cart.items[0].course_id._id,
            amount: totalAmount,
            payment_method,
            payment_status: 'pending',
            order_code: `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        });
        await payment.save();

        // Xóa giỏ hàng sau khi checkout
        await Cart.findOneAndDelete({ user_id: userId });

        res.status(201).json({
            success: true,
            message: 'Đã tạo đơn hàng thành công',
            data: {
                payment: {
                    _id: payment._id,
                    order_code: payment.order_code,
                    amount: payment.amount,
                    payment_method: payment.payment_method,
                    payment_status: payment.payment_status
                }
            }
        });
    } catch (error) {
        console.error('Lỗi checkout:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
