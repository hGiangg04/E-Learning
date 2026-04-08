import { Link } from 'react-router-dom';

const StarIcon = () => (
  <svg className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

export default function CourseCard({ course }) {
  const {
    _id,
    title,
    description,
    thumbnail,
    price,
    discount_price,
    instructor,
    average_rating,
    review_count,
    student_count,
    duration_hours,
    level,
    category
  } = course;

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

  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Link
      to={`/courses/${_id}`}
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
          <span className={`absolute top-3 right-3 px-2 py-1 ${levelColors[level] || 'bg-gray-100'} text-xs font-medium rounded`}>
            {levelLabels[level] || level}
          </span>
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

        {/* Instructor */}
        {instructor && (
          <p className="text-sm text-gray-500 mb-3">
            Giảng viên: <span className="text-gray-700">{instructor.name}</span>
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {average_rating !== undefined && (
            <div className="flex items-center gap-1">
              <StarIcon />
              <span className="font-medium text-gray-700">{average_rating.toFixed(1)}</span>
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
