import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { certificateService } from '../api/certificateService';
import { enrollmentService, progressService } from '../api';

const AwardIcon = () => (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

export default function CertificatesPage() {
    const navigate = useNavigate();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: { pathname: '/certificates' } } });
            return;
        }
        const load = async () => {
            try {
                // Đồng bộ tiến độ từng khóa đang học → backend cấp chứng chỉ nếu đã 100%
                try {
                    const mine = await enrollmentService.getMine();
                    const enrollments = mine.data?.data?.enrollments || [];
                    for (const e of enrollments) {
                        if (e.status !== 'active') continue;
                        const cid = e.course_id?._id ?? e.course_id;
                        if (cid) {
                            try {
                                await progressService.getCourseProgress(String(cid));
                            } catch {
                                /* bỏ qua từng khóa lỗi */
                            }
                        }
                    }
                } catch {
                    /* không có danh sách ghi danh */
                }

                const res = await certificateService.getMyCertificates();
                if (res.success) {
                    setCertificates(res.data?.certificates || []);
                }
            } catch (e) {
                toast.error('Không tải được chứng chỉ');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate, token]);

    return (
        <PageLayout>
            <div className="pt-28 pb-16 px-4 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-primary-600"><AwardIcon /></span>
                        <h1 className="text-3xl font-bold text-gray-900">Chứng chỉ của tôi</h1>
                    </div>
                    <p className="text-gray-600 mb-8">Những chứng chỉ bạn đã nhận được khi hoàn thành khóa học</p>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(i => (
                                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có chứng chỉ nào</h2>
                            <p className="text-gray-500 mb-6">Hoàn thành khóa học để nhận chứng chỉ</p>
                            <Link to="/courses" className="btn-primary">
                                Khám phá khóa học
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {certificates.map(cert => {
                                const course = cert.course_id;
                                return (
                                    <div key={cert._id} className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-yellow-500">🏆</span>
                                                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Chứng chỉ hoàn thành</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                                {course?.title || 'Khóa học'}
                                            </h3>
                                            {course?.instructor_id?.name && (
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Giảng viên: <span className="font-medium">{course.instructor_id.name}</span>
                                                </p>
                                            )}
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex justify-between">
                                                    <span>Mã chứng chỉ:</span>
                                                    <span className="font-mono font-medium text-gray-900">{cert.certificate_number}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Ngày cấp:</span>
                                                    <span className="font-medium">{new Date(cert.issued_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                {cert.expires_at && (
                                                    <div className="flex justify-between">
                                                        <span>Hết hạn:</span>
                                                        <span className="font-medium">{new Date(cert.expires_at).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 flex gap-3">
                                                <Link
                                                    to={`/certificates/${cert.certificate_number}`}
                                                    className="flex-1 text-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm"
                                                >
                                                    Xem chi tiết
                                                </Link>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(cert.certificate_number)}
                                                    className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-white rounded-lg transition-colors text-sm"
                                                    title="Sao chép mã"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
