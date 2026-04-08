import { Link } from 'react-router-dom';

const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 overflow-hidden pt-20">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              Chào mừng đến với E-Learning
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Kiến thức mọi lúc,<br />
              <span className="text-primary-600">Mọi nơi</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Khám phá hàng ngàn khóa học chất lượng cao từ các chuyên gia hàng đầu. 
              Học tập theo tốc độ của riêng bạn và phát triển kỹ năng mới mỗi ngày.
            </p>

            {/* Stats badges */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center lg:justify-start">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="text-yellow-400"><StarIcon /></span>
                <span className="font-semibold text-gray-900">4.8</span>
                <span>đánh giá</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">15,000+</span>
                <span>học viên</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">500+</span>
                <span>khóa học</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/courses" className="btn-primary flex items-center justify-center gap-2">
                Khám phá khóa học
                <ArrowIcon />
              </Link>
              <Link to="/register" className="btn-secondary flex items-center justify-center gap-2">
                Bắt đầu miễn phí
              </Link>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lập trình Web</h3>
                    <p className="text-sm text-gray-500">32 bài học</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" />
                </div>
                <p className="text-sm text-primary-600 mt-2 font-medium">75% hoàn thành</p>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 animate-bounce-slow">
                <span className="text-2xl">🎓</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted logos */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-6">Được tin tưởng bởi các tổ chức hàng đầu</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale">
            <span className="text-xl font-bold text-gray-400">Google</span>
            <span className="text-xl font-bold text-gray-400">Microsoft</span>
            <span className="text-xl font-bold text-gray-400">Amazon</span>
            <span className="text-xl font-bold text-gray-400">Meta</span>
            <span className="text-xl font-bold text-gray-400">Apple</span>
          </div>
        </div>
      </div>
    </section>
  );
}
