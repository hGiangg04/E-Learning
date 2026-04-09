import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { cartService } from '../api/cartService';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('banking');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
            return;
        }
        const load = async () => {
            try {
                const res = await cartService.getMyCart();
                if (res.success) {
                    if (!res.data?.items?.length) {
                        toast.error('Giỏ hàng trống');
                        navigate('/cart');
                        return;
                    }
                    setCart(res.data);
                }
            } catch (e) {
                toast.error('Không tải được thông tin');
                navigate('/cart');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate, token]);

    const handleCheckout = async () => {
        setSubmitting(true);
        try {
            const res = await cartService.checkout(selectedMethod);
            if (res.success) {
                toast.success('Đã tạo đơn hàng! Vui lòng thanh toán theo hướng dẫn.');
                window.dispatchEvent(new Event('cart-changed'));
                // Chuyển đến trang thông báo thanh toán hoặc lịch sử
                setTimeout(() => navigate('/my-courses'), 2000);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
    };

    const getCoursePrice = (course) => {
        return course.discount_price > 0 ? course.discount_price : course.price;
    };

    const paymentMethods = [
        { id: 'banking', name: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'Chuyển khoản trực tiếp qua internet banking' },
        { id: 'vnpay', name: 'VNPay', icon: '💳', desc: 'Thanh toán qua cổng VNPay' },
        { id: 'momo', name: 'MoMo', icon: '📱', desc: 'Thanh toán qua ví MoMo' }
    ];

    if (loading) {
        return (
            <PageLayout>
                <div className="pt-28 px-4 max-w-2xl mx-auto animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng của bạn</h2>
                        <div className="space-y-3">
                            {cart?.items?.map(item => {
                                const course = item.course;
                                const price = getCoursePrice(course);
                                return (
                                    <div key={item._id} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">📚</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                                                {course.instructor_id?.name && (
                                                    <p className="text-xs text-gray-500">{course.instructor_id.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-semibold text-primary-600 shrink-0">{formatPrice(price)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Tổng cộng:</span>
                            <span className="text-2xl font-bold text-primary-600">{formatPrice(cart?.total)}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                        <div className="space-y-3">
                            {paymentMethods.map(method => (
                                <label
                                    key={method.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedMethod === method.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={method.id}
                                        checked={selectedMethod === method.id}
                                        onChange={() => setSelectedMethod(method.id)}
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <span className="text-2xl">{method.icon}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{method.name}</p>
                                        <p className="text-sm text-gray-500">{method.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/cart"
                            className="flex-1 text-center py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                        >
                            ← Quay lại giỏ hàng
                        </Link>
                        <button
                            onClick={handleCheckout}
                            disabled={submitting}
                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
                        >
                            {submitting ? 'Đang xử lý...' : `Thanh toán ${formatPrice(cart?.total)}`}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        Bằng cách nhấn "Thanh toán", bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của chúng tôi
                    </p>
                </div>
            </div>
        </PageLayout>
    );
}
