import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { notificationService } from '../api/notificationService';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const loadNotifications = async () => {
        try {
            const res = await notificationService.getMyNotifications(1, 50);
            if (res.success) {
                setNotifications(res.data?.notifications || []);
            }
        } catch (e) {
            toast.error('Không tải được thông báo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: { pathname: '/notifications' } } });
            return;
        }
        loadNotifications();
    }, [navigate, token]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: 1 } : n));
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            toast.success('Đã đánh dấu tất cả đã đọc');
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Đã xóa thông báo');
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const getIcon = (type) => {
        const icons = {
            enrollment: '📚',
            payment: '💳',
            quiz: '📝',
            course: '🎓',
            system: '🔔',
            achievement: '🏆',
            review: '⭐',
            certificate: '📜'
        };
        return icons[type] || '🔔';
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <PageLayout>
            <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
                            <p className="text-gray-600 mt-1">
                                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="text-6xl mb-4">🔔</div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Không có thông báo nào</h2>
                            <p className="text-gray-500">Bạn sẽ nhận thông báo khi có cập nhật mới</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                            {notifications.map(notif => (
                                <div
                                    key={notif._id}
                                    className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors ${
                                        !notif.is_read ? 'bg-primary-50/30' : ''
                                    }`}
                                >
                                    <span className="text-3xl shrink-0">{getIcon(notif.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notif.created_at).toLocaleDateString('vi-VN', {
                                                        weekday: 'short', day: '2-digit', month: 'short',
                                                        year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notif._id)}
                                                        className="text-xs text-gray-400 hover:text-primary-600 p-2"
                                                        title="Đánh dấu đã đọc"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notif._id)}
                                                    className="text-xs text-gray-400 hover:text-red-500 p-2"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {notif.link && (
                                            <Link
                                                to={notif.link}
                                                onClick={() => notif.is_read || handleMarkAsRead(notif._id)}
                                                className="inline-block mt-2 text-xs text-primary-600 hover:underline"
                                            >
                                                Xem chi tiết →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
