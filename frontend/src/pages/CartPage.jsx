import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { cartService } from '../api/cartService';

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CartIcon = () => (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export default function CartPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const loadCart = async () => {
        try {
            const res = await cartService.getMyCart();
            if (res.success) {
                setItems(res.data?.items || []);
                setTotal(res.data?.total || 0);
            }
        } catch (e) {
            toast.error('Không tải được giỏ hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: { pathname: '/cart' } } });
            return;
        }
        loadCart();
    }, [navigate, token]);

    const handleRemove = async (courseId) => {
        try {
            await cartService.removeFromCart(courseId);
            setItems(prev => prev.filter(item => String(item.course._id) !== String(courseId)));
            toast.success('Đã xóa khỏi giỏ hàng');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Không thể xóa');
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const formatPrice = (price) => {
        if (!price) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
    };

    const getCoursePrice = (course) => {
        return course.discount_price > 0 ? course.discount_price : course.price;
    };

    return (
        <PageLayout>
            <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-primary-600"><CartIcon /></span>
                        <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
                    </div>
                    <p className="text-gray-600 mb-8">
                        {items.length > 0 ? `${items.length} khóa học trong giỏ hàng` : 'Giỏ hàng của bạn đang trống'}
                    </p>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="text-6xl mb-4">🛒</div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Giỏ hàng trống</h2>
                            <p className="text-gray-500 mb-6">Hãy thêm những khóa học bạn quan tâm</p>
                            <Link to="/courses" className="btn-primary">
                                Khám phá khóa học
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map(item => {
                                const course = item.course;
                                const cid = course._id;
                                const price = getCoursePrice(course);
                                const originalPrice = course.price;
                                const hasDiscount = course.discount_price > 0 && course.price > course.discount_price;

                                return (
                                    <div key={item._id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <Link to={`/courses/${cid}`} className="shrink-0">
                                            <div className="w-full sm:w-40 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <Link to={`/courses/${cid}`} className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1">
                                                        {course.title}
                                                    </Link>
                                                    {course.instructor_id?.name && (
                                                        <p className="text-sm text-gray-500 mt-0.5">{course.instructor_id.name}</p>
                                                    )}
                                                    {course.average_rating > 0 && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className="text-yellow-400">★</span>
                                                            <span className="text-sm text-gray-600">{course.average_rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(cid)}
                                                    className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa khỏi giỏ hàng"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div>
                                                    <span className="text-lg font-bold text-primary-600">{formatPrice(price)}</span>
                                                    {hasDiscount && (
                                                        <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(originalPrice)}</span>
                                                    )}
                                                </div>
                                                <Link to={`/courses/${cid}`} className="text-sm text-primary-600 hover:underline">
                                                    Xem khóa học
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600">Tổng cộng:</span>
                                    <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Thanh toán
                                </button>
                                <p className="text-xs text-gray-500 text-center mt-3">
                                    Bạn sẽ được chuyển đến trang thanh toán an toàn
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
