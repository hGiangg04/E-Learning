import axios from './axios';

export const wishlistService = {
    // Lấy danh sách wishlist
    getMyWishlist: async () => {
        const res = await axios.get('/wishlist');
        return res.data;
    },

    // Thêm vào wishlist
    addToWishlist: async (courseId) => {
        const res = await axios.post('/wishlist', { course_id: courseId });
        return res.data;
    },

    // Xóa khỏi wishlist
    removeFromWishlist: async (courseId) => {
        const res = await axios.delete(`/wishlist/${courseId}`);
        return res.data;
    },

    // Kiểm tra wishlist
    checkWishlist: async (courseId) => {
        const res = await axios.get(`/wishlist/check/${courseId}`);
        return res.data;
    }
};
