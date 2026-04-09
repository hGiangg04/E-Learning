import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { notificationService } from '../api';

const notifTypeLabel = {
    enrollment_approved: 'Duyệt đăng ký',
    enrollment_rejected: 'Từ chối',
    comment: 'Bình luận',
    reply: 'Trả lời',
    certificate: 'Chứng chỉ',
    course_published: 'Khóa học mới',
    system: 'Hệ thống',
};

const notifTypeColor = {
    enrollment_approved: 'bg-emerald-100 text-emerald-700',
    enrollment_rejected: 'bg-red-100 text-red-700',
    comment: 'bg-blue-100 text-blue-700',
    reply: 'bg-violet-100 text-violet-700',
    certificate: 'bg-amber-100 text-amber-700',
    course_published: 'bg-primary-100 text-primary-700',
    system: 'bg-gray-100 text-gray-700',
};

export default function NotificationsPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });

    useEffect(() => {
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            navigate('/login');
            return;
        }
        let cancelled = false;
        setLoading(true);
        notificationService.getNotifications({ page, limit: 20 })
            .then(res => {
                if (cancelled || !res?.success) return;
                if (page === 1) {
                    setNotifications(res.data?.notifications ?? []);
                } else {
                    setNotifications(prev => [...prev, ...(res.data?.notifications ?? [])]);
                }
                setPagination(res.data?.pagination ?? { pages: 1, total: 0 });
            })
            .catch(() => toast.error('Không tải được thông báo'))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, page, navigate]);

    const handleMarkRead = async (notif) => {
        if (notif.is_read) return;
        await notificationService.markRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: 1 } : n));
    };

    const handleDelete = async (notifId) => {
        if (!window.confirm('Xóa thông báo này?')) return;
        const res = await notificationService.deleteNotification(notifId);
        if (res?.success) {
            setNotifications(prev => prev.filter(n => n._id !== notifId));
            toast.success('Đã xóa');
        }
    };

    const handleMarkAll = async () => {
        await notificationService.markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        toast.success('Đã đánh dấu tất cả là đã đọc');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <PageLayout>
            <div className="pt-24 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading && notifications.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">Đang tải…</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-400">Không có thông báo nào.</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-primary-50/30' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${notifTypeColor[notif.type] || 'bg-gray-100 text-gray-700'}`}>
                                            {notifTypeLabel[notif.type]?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-medium text-primary-600">{notifTypeLabel[notif.type] || 'Thông báo'}</span>
                                                {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 flex flex-col gap-1">
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => handleMarkRead(notif)}
                                                    className="text-xs text-primary-600 hover:underline"
                                                >
                                                    Đánh dấu đã đọc
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notif._id)}
                                                className="text-xs text-red-400 hover:underline"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {page < pagination.pages && (
                                    <div className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={loading}
                                            className="px-6 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                                        >
                                            {loading ? 'Đang tải…' : 'Tải thêm'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
