import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationService } from '../api/notificationService';

const BellIcon = ({ hasUnread }) => (
    <div className="relative">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {hasUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {hasUnread > 9 ? '9+' : hasUnread}
            </span>
        )}
    </div>
);

export default function NotificationBell() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    const loadNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await notificationService.getMyNotifications(1, 10);
            if (res.success) {
                setNotifications(res.data?.notifications || []);
                setUnreadCount(res.data?.unread_count || 0);
            }
        } catch (e) {
            console.error(e);
        }
    }, [token]);

    useEffect(() => {
        loadNotifications();
        const onRefresh = () => loadNotifications();
        window.addEventListener('notifications-refresh', onRefresh);
        // Poll mỗi 60s
        const interval = setInterval(loadNotifications, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('notifications-refresh', onRefresh);
        };
    }, [loadNotifications]);

    const handleMarkAsRead = async (e, id) => {
        e.preventDefault();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả đã đọc');
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        try {
            await notificationService.deleteNotification(id);
            const notif = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (notif && !notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleNotificationClick = async (e, notif) => {
        if (!notif.is_read) {
            await handleMarkAsRead(e, notif._id);
        }
        if (notif.link) {
            navigate(notif.link);
            setIsOpen(false);
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

    if (!token) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                title="Thông báo"
            >
                <BellIcon hasUnread={unreadCount} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Thông báo</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-primary-600 hover:underline"
                                >
                                    Đánh dấu đã đọc
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Đang tải...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <div className="text-4xl mb-2">🔔</div>
                                    <p>Không có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        onClick={(e) => handleNotificationClick(e, notif)}
                                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${
                                            !notif.is_read ? 'bg-primary-50/50' : ''
                                        }`}
                                    >
                                        <span className="text-2xl shrink-0">{getIcon(notif.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!notif.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleDateString('vi-VN', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, notif._id)}
                                            className="shrink-0 text-gray-300 hover:text-red-500 p-1 transition-colors"
                                            title="Xóa"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {!notif.is_read && <span className="shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2" />}
                                    </div>
                                ))
                            )}
                        </div>

                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block text-center py-3 text-sm text-primary-600 hover:bg-primary-50 font-medium transition-colors border-t border-gray-100"
                        >
                            Xem tất cả thông báo
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
