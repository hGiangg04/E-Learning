import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistService } from '../api';

const StarIcon = () => (
  <svg className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg
    className={`w-6 h-6 transition-all duration-300 ${filled ? 'fill-red-500 text-red-500 scale-110' : 'fill-none text-white hover:text-red-300'}`}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function CourseCard({ course, showWishlist = true }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    _id,
    slug,
    title,
    thumbnail,
    price,
    discount_price,
    average_rating,
    review_count,
    student_count,
    duration_hours,
    level,
  } = course;

  const category = course.category || course.category_id;
  const instructor = course.instructor || course.instructor_id;

  const discountedPrice = discount_price || price;
  const hasDiscount = discount_price && discount_price < price;
  const discountPercent = hasDiscount ? Math.round((1 - discount_price / price) * 100) : 0;

  const levelLabels = {
    beginner: 'Người mới',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao'
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const coursePath = slug ? `/courses/${encodeURIComponent(slug)}` : `/courses/${_id}`;

  // Kiểm tra trạng thái wishlist khi component mount
  useEffect(() => {
    if (token && _id && showWishlist) {
      checkWishlistStatus();
    }
  }, [token, _id, showWishlist]);

  const checkWishlistStatus = async () => {
    try {
      const res = await wishlistService.checkWishlist(_id);
      if (res?.success) {
        setIsWishlisted(res.data?.in_wishlist);
      }
    } catch (error) {
      // Ignore errors - user might not be logged in
    }
  };

  const handleWishlistToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(_id);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(_id);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, isWishlisted, _id, isLoading]);

  return (
    <Link
      to={coursePath}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-5xl">📚</span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            -{discountPercent}%
          </span>
        )}

        {/* Level badge */}
        {level && (
          <span className={`absolute top-3 px-2 py-1 ${level === 'left' ? 'left-1/2 -translate-x-1/2' : 'right-3'} ${levelColors[level] || 'bg-gray-100'} text-xs font-medium rounded`}>
            {levelLabels[level] || level}
          </span>
        )}

        {/* Wishlist button */}
        {showWishlist && (
          <button
            onClick={handleWishlistToggle}
            disabled={isLoading}
            className={`absolute p-2 rounded-full transition-all duration-200 ${
              level ? 'right-3 top-10' : 'right-3 top-3'
            } ${isWishlisted ? 'bg-white/90 shadow-md' : 'bg-black/30 hover:bg-black/50'}`}
            title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {category && (
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
            {category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg mt-1 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {/* Instructor — không dùng Link lồng trong Link (card bọc ngoài là Link) */}
        {instructor && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const iid = typeof instructor === 'object' ? instructor._id : instructor;
              if (iid) navigate(`/instructor/${String(iid)}`);
            }}
            className="text-sm text-gray-500 mb-3 hover:text-primary-600 transition-colors text-left w-full"
          >
            Giảng viên: <span className="text-gray-700">{instructor.name}</span>
          </button>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {average_rating != null && !Number.isNaN(Number(average_rating)) && (
            <div className="flex items-center gap-1">
              <StarIcon />
              <span className="font-medium text-gray-700">{Number(average_rating).toFixed(1)}</span>
              <span>({review_count || 0})</span>
            </div>
          )}
          {student_count !== undefined && (
            <div className="flex items-center gap-1">
              <UserIcon />
              <span>{student_count || 0}</span>
            </div>
          )}
          {duration_hours && (
            <div className="flex items-center gap-1">
              <ClockIcon />
              <span>{duration_hours}h</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
            <span className={`text-xl font-bold ${hasDiscount ? 'text-red-500' : 'text-gray-900'} ml-2`}>
              {formatPrice(discountedPrice)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
