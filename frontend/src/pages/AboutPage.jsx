import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="pt-28 pb-20 px-4 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Về chúng tôi</h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            E-Learning là nền tảng học trực tuyến giúp bạn tiếp cận kiến thức mọi lúc, mọi nơi. Chúng tôi hợp tác
            với giảng viên và chuyên gia để xây dựng lộ trình học rõ ràng, thực chiến.
          </p>
          <ul className="mt-8 space-y-4 text-gray-700">
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              Khóa học đa lĩnh vực, cập nhật thường xuyên
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              Học linh hoạt, theo tiến độ cá nhân
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">✓</span>
              Hỗ trợ ghi danh và thanh toán qua hệ thống
            </li>
          </ul>
          <Link to="/courses" className="btn-primary mt-10 inline-flex">
            Xem khóa học
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
