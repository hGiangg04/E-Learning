import axios from './axios';

export const cartService = {
    // Lấy giỏ hàng
    getMyCart: async () => {
        const res = await axios.get('/cart');
        return res.data;
    },

    // Thêm vào giỏ hàng
    addToCart: async (courseId) => {
        const res = await axios.post('/cart', { course_id: courseId });
        return res.data;
    },

    // Xóa khỏi giỏ hàng
    removeFromCart: async (courseId) => {
        const res = await axios.delete(`/cart/${courseId}`);
        return res.data;
    },

    // Xóa tất cả giỏ hàng
    clearCart: async () => {
        const res = await axios.delete('/cart');
        return res.data;
    },

    // Checkout
    checkout: async (paymentMethod = 'banking') => {
        const res = await axios.post('/cart/checkout', { payment_method: paymentMethod });
        return res.data;
    }
};
