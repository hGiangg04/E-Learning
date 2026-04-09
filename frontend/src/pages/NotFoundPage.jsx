import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function NotFoundPage() {
    return (
        <PageLayout>
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-9xl font-bold text-primary-100 mb-4">404</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Trang không tìm thấy</h1>
                    <p className="text-gray-600 mb-8">
                        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/" className="btn-primary px-8 py-3">
                            Về trang chủ
                        </Link>
                        <Link to="/courses" className="btn-secondary px-8 py-3">
                            Khám phá khóa học
                        </Link>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
