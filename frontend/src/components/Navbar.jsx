import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notificationService } from '../api';

const BookIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  /* ── User sync ── */
  const [user, setUser] = useState(null);
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    syncUser();
    window.addEventListener('auth-changed', syncUser);
    return () => window.removeEventListener('auth-changed', syncUser);
  }, [location.pathname]);

  /* ── Notification polling ── */
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 10 });
        if (cancelled || !res?.success) return;
        setNotifications(res.data?.notifications ?? []);
        setUnreadCount(res.data?.unread_count ?? 0);
      } catch { /* ignore */ }
    };

    load();
    const interval = setInterval(load, 30000); // 30s refresh
    return () => { cancelled = true; clearInterval(interval); };
  }, [token]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    await notificationService.markRead(notif._id);
    setUnreadCount(c => Math.max(0, c - 1));
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: 1 } : n));
  };

  const handleNotifClick = (notif) => {
    handleMarkRead(notif);
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const notifTypeLabel = {
    enrollment_approved: 'Duyệt đăng ký',
    enrollment_rejected: 'Từ chối',
    comment: 'Bình luận',
    reply: 'Trả lời',
    certificate: 'Chứng chỉ',
    course_published: 'Khóa học mới',
    system: 'Hệ thống',
  };

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Khóa học', href: '/courses' },
    { label: 'Về chúng tôi', href: '/about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-primary-600 group-hover:scale-110 transition-transform">
              <BookIcon />
            </span>
            <span className="text-xl font-bold text-gray-900">
              E-Learning
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname === link.href
                    ? 'text-primary-600'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(v => !v)}
                    className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Thông báo"
                  >
                    <BellIcon />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-900 text-sm">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                            <CheckIcon /> Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-sm text-gray-400">Không có thông báo nào</div>
                        ) : (
                          notifications.map(notif => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notif.is_read ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                {!notif.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                                <div className={`flex-1 min-w-0 ${!notif.is_read ? '' : 'ml-5'}`}>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium text-primary-600">{notifTypeLabel[notif.type] || 'Thông báo'}</span>
                                    {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{notif.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }} className="w-full text-center text-xs text-primary-600 hover:underline py-1">
                          Xem tất cả thông báo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <UserIcon />
                  </span>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border py-2 z-40">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hồ sơ</Link>
                    <Link to="/my-courses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Khóa học của tôi</Link>
                    <Link to="/my-certificates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Chứng chỉ của tôi</Link>
                    {user?.role === 'admin' && <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Quản lý Admin</Link>}
                    <hr className="my-2" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                  </div>
                )}
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-base font-medium ${
                    location.pathname === link.href
                      ? 'text-primary-600'
                      : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <span className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      <UserIcon />
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                  </div>
                  <Link to="/profile" className="text-sm text-gray-600">Hồ sơ</Link>
                  <Link to="/my-courses" className="text-sm text-gray-600">Khóa học của tôi</Link>
                  <Link to="/my-certificates" className="text-sm text-gray-600">Chứng chỉ của tôi</Link>
                  <Link to="/notifications" className="text-sm text-gray-600 flex items-center gap-2">
                    Thông báo {unreadCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </Link>
                  <button onClick={handleLogout} className="text-left text-sm text-red-600">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="btn-secondary text-center text-sm">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary text-center text-sm">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
