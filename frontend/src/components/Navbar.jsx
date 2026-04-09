import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { cartService } from '../api/cartService';

const BookIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

const CartNavIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);


export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshCartCount = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setCartCount(0);
      return;
    }
    try {
      const res = await cartService.getMyCart();
      if (res.success) {
        setCartCount(res.data?.items?.length ?? 0);
      }
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    syncUser();
    window.addEventListener('auth-changed', syncUser);
    return () => window.removeEventListener('auth-changed', syncUser);
  }, [location.pathname]);

  useEffect(() => {
    refreshCartCount();
  }, [location.pathname, user, refreshCartCount]);

  useEffect(() => {
    const onCart = () => refreshCartCount();
    window.addEventListener('cart-changed', onCart);
    return () => window.removeEventListener('cart-changed', onCart);
  }, [refreshCartCount]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Khóa học', href: '/courses' },
    { label: 'Yêu thích', href: '/wishlist' },
    { label: 'Chứng chỉ', href: '/certificates' },
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
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/cart"
                  className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                  title="Giỏ hàng"
                  aria-label="Giỏ hàng"
                >
                  <CartNavIcon />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center text-[10px] font-bold text-white bg-primary-600 rounded-full">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                <NotificationBell />
                <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <UserIcon />
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Hồ sơ
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Quản trị
                      </Link>
                    )}
                    <Link
                      to="/my-courses"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Khóa học của tôi
                    </Link>
                    <Link
                      to="/cart"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Giỏ hàng{cartCount > 0 ? ` (${cartCount})` : ''}
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
                </div>
              </div>
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

          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-primary-600"
                title="Giỏ hàng"
                aria-label="Giỏ hàng"
              >
                <CartNavIcon />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center text-[10px] font-bold text-white bg-primary-600 rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary-600"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
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
                  <Link to="/profile" className="text-sm text-gray-600">
                    Hồ sơ
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium text-primary-600">
                      Quản trị
                    </Link>
                  )}
                  <Link to="/notifications" className="text-sm text-gray-600">
                    Thông báo
                  </Link>
                  <Link to="/certificates" className="text-sm text-gray-600">
                    Chứng chỉ
                  </Link>
                  <Link to="/cart" className="text-sm text-gray-600 relative">
                    Giỏ hàng
                  </Link>
                  <Link to="/my-courses" className="text-sm text-gray-600">
                    Khóa học của tôi
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-sm text-red-600"
                  >
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
