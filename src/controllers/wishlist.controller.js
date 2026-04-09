const Wishlist = require('../models/wishlist.model');
const Course = require('../models/course.model');

// Lấy danh sách wishlist của user
exports.getMyWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Wishlist.find({ user_id: userId })
            .populate({
                path: 'course_id',
                select: 'title thumbnail price discount_price instructor_id category_id average_rating review_count student_count',
                populate: [
                    { path: 'instructor_id', select: 'name avatar' },
                    { path: 'category_id', select: 'name' }
                ]
            })
            .sort({ created_at: -1 });

        const courses = items
            .filter(item => item.course_id)
            .map(item => ({
                _id: item._id,
                course: item.course_id,
                added_at: item.created_at
            }));

        res.json({
            success: true,
            data: { wishlist: courses }
        });
    } catch (error) {
        console.error('Lỗi getMyWishlist:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Thêm khóa học vào wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'course_id là bắt buộc' });
        }

        // Kiểm tra khóa học có tồn tại không
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
        }

        // Kiểm tra đã có trong wishlist chưa
        const existing = await Wishlist.findOne({ user_id: userId, course_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Khóa học đã có trong danh sách yêu thích' });
        }

        const wishlistItem = new Wishlist({
            user_id: userId,
            course_id
        });
        await wishlistItem.save();

        res.status(201).json({
            success: true,
            message: 'Đã thêm vào danh sách yêu thích',
            data: { wishlist: wishlistItem }
        });
    } catch (error) {
        console.error('Lỗi addToWishlist:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa khóa học khỏi wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;

        const deleted = await Wishlist.findOneAndDelete({ user_id: userId, course_id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trong danh sách yêu thích' });
        }

        res.json({
            success: true,
            message: 'Đã xóa khỏi danh sách yêu thích'
        });
    } catch (error) {
        console.error('Lỗi removeFromWishlist:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Kiểm tra khóa học có trong wishlist không
exports.checkWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.params;

        const item = await Wishlist.findOne({ user_id: userId, course_id });

        res.json({
            success: true,
            data: {
                in_wishlist: !!item,
                wishlist_id: item?._id || null
            }
        });
    } catch (error) {
        console.error('Lỗi checkWishlist:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
