import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80',
    title: 'Học cùng chuyên gia',
    subtitle: 'Khóa học được thiết kế bài bản, cập nhật xu hướng công nghệ.',
    cta: 'Xem khóa học',
    href: '/courses',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80',
    title: 'Kiến thức mọi lúc, mọi nơi',
    subtitle: 'Học linh hoạt trên mọi thiết bị — tiến độ do bạn chủ động.',
    cta: 'Bắt đầu ngay',
    href: '/register',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1920&q=80',
    title: 'Nâng cấp sự nghiệp',
    subtitle: 'Chứng chỉ và kỹ năng thực chiến giúp bạn nổi bật trên thị trường.',
    cta: 'Khám phá',
    href: '/courses',
  },
];

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);

  const go = useCallback((dir) => {
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return SLIDES.length - 1;
      if (next >= SLIDES.length) return 0;
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => go(1), 5500);
    return () => clearInterval(t);
  }, [go]);

  return (
    <section
      className="relative w-full overflow-hidden bg-gray-900"
      aria-roledescription="carousel"
      aria-label="Banner quảng cáo"
    >
      <div className="relative h-[min(52vh,520px)] min-h-[280px] w-full">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={i !== index}
          >
            <img
              src={s.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-900/55 to-gray-900/25" />
            <div className="relative z-[2] flex h-full w-full items-center px-4 sm:px-8 lg:px-12 xl:px-16">
              <div className="max-w-3xl text-left">
                <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-xl text-base text-gray-200 sm:text-lg">{s.subtitle}</p>
                <Link
                  to={s.href}
                  className="btn-primary mt-8 inline-flex shadow-lg shadow-primary-900/40"
                >
                  {s.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 z-[3] -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Slide trước"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Slide sau"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-0 right-0 z-[3] flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Chuyển đến slide ${i + 1}`}
            aria-current={i === index}
          />
        ))}
      </div>
    </section>
  );
}
