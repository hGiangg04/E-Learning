import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reviewService } from '../api/reviewService';

const StarIcon = ({ filled, half, onClick, size = 'md' }) => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${sizeClass} ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
            <span className={filled ? 'text-yellow-400' : half ? 'text-yellow-400' : 'text-gray-300'}>
                ★
            </span>
        </button>
    );
};

export default function ReviewsSection({ courseId }) {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [myReview, setMyReview] = useState(null);
    const [formData, setFormData] = useState({ rating: 0, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const token = localStorage.getItem('token');

    const loadReviews = async (page = 1) => {
        setLoading(true);
        try {
            const res = await reviewService.getReviewsByCourse(courseId, page, 5);
            if (res.success) {
                setReviews(res.data.reviews || []);
                setStats(res.data.stats || { averageRating: 0, totalReviews: 0 });
                setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMyReview = async () => {
        if (!token) return;
        try {
            const res = await reviewService.getMyReview(courseId);
            if (res.success && res.data?.review) {
                setMyReview(res.data.review);
                setFormData({ rating: res.data.review.rating, comment: res.data.review.comment || '' });
            }
        } catch (e) {
            // Chưa có review
        }
    };

    useEffect(() => {
        loadReviews();
        loadMyReview();
    }, [courseId]);

    const handleStarClick = (star) => {
        setFormData(prev => ({ ...prev, rating: star }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Vui lòng đăng nhập để đánh giá');
            navigate('/login');
            return;
        }
        if (formData.rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }
        setSubmitting(true);
        try {
            let res;
            if (myReview) {
                res = await reviewService.updateReview(courseId, formData);
            } else {
                res = await reviewService.createReview({ course_id: courseId, ...formData });
            }
            if (res.success) {
                toast.success(myReview ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá!');
                setMyReview(res.data?.review);
                setShowForm(false);
                loadReviews();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
        try {
            await reviewService.deleteReview(courseId);
            toast.success('Đã xóa đánh giá');
            setMyReview(null);
            setFormData({ rating: 0, comment: '' });
            loadReviews();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const renderStars = (rating, size = 'md') => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <StarIcon key={i} filled={i <= rating} size={size} />
            );
        }
        return stars;
    };

    const renderRatingBar = (star, count, total) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-600">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-gray-500 text-right">{count}</span>
            </div>
        );
    };

    return (
        <section className="mt-10 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Đánh giá từ học viên</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {stats.totalReviews > 0 ? `${stats.totalReviews} đánh giá` : 'Chưa có đánh giá nào'}
                </p>
            </div>

            <div className="p-6">
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                        <div className="flex justify-center md:justify-start mt-2">{renderStars(Math.round(stats.averageRating))}</div>
                        <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} đánh giá</p>
                    </div>
                    <div className="flex-1 space-y-2 max-w-sm">
                        {[5, 4, 3, 2, 1].map(star => renderRatingBar(star, 0, stats.totalReviews || 1))}
                    </div>
                </div>

                {/* My Review / Write Review Button */}
                <div className="mb-6 border-t border-gray-100 pt-6">
                    {myReview ? (
                        <div className="bg-primary-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-800">Đánh giá của bạn</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowForm(!showForm)} className="text-sm text-primary-600 hover:underline">
                                        Chỉnh sửa
                                    </button>
                                    <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
                                        Xóa
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">{renderStars(myReview.rating, 'sm')}</div>
                            {myReview.comment && <p className="text-sm text-gray-600">{myReview.comment}</p>}
                            <p className="text-xs text-gray-400 mt-2">
                                {new Date(myReview.created_at).toLocaleDateString('vi-VN')}
                            </p>

                            {showForm && (
                                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => (
                                        <StarIcon key={s} filled={s <= formData.rating} onClick={() => handleStarClick(s)} size="lg" />
                                    ))}</div>
                                    <textarea
                                        value={formData.comment}
                                        onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                                        placeholder="Chia sẻ trải nghiệm học tập của bạn..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                        maxLength={2000}
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={submitting} className="btn-primary text-sm">
                                            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                        </button>
                                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Hủy</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                if (!token) { navigate('/login'); return; }
                                setShowForm(!showForm);
                            }}
                            className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Viết đánh giá
                        </button>
                    )}
                </div>

                {/* Review Form */}
                {showForm && !myReview && (
                    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-xl space-y-4">
                        <h3 className="font-medium text-gray-800">Đánh giá của bạn</h3>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <StarIcon key={s} filled={s <= formData.rating} onClick={() => handleStarClick(s)} size="lg" />
                            ))}
                        </div>
                        <textarea
                            value={formData.comment}
                            onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Chia sẻ trải nghiệm học tập của bạn... (tùy chọn)"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            maxLength={2000}
                        />
                        <div className="flex gap-2">
                            <button type="submit" disabled={submitting || formData.rating === 0} className="btn-primary disabled:opacity-60">
                                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
                        </div>
                    </form>
                )}

                {/* Reviews List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review._id} className="pb-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0">
                                        {review.user_id?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <span className="font-medium text-gray-900">{review.user_id?.name || 'Học viên'}</span>
                                                <div className="flex items-center gap-1 mt-0.5">{renderStars(review.rating, 'sm')}</div>
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{review.comment}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => loadReviews(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                    page === pagination.page
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
