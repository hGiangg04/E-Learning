import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { certificateService } from '../api/certificateService';

export default function CertificateDetailPage() {
    const { certNumber } = useParams();
    const navigate = useNavigate();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await certificateService.getCertificateDetail(certNumber);
                if (res.success) {
                    setCert(res.data?.certificate);
                } else {
                    setError('Không tìm thấy chứng chỉ');
                }
            } catch (e) {
                setError('Không tải được chứng chỉ');
            } finally {
                setLoading(false);
            }
        };
        if (certNumber) load();
    }, [certNumber]);

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await certificateService.verifyCertificate(certNumber);
            setVerifyResult(res);
        } catch (e) {
            setVerifyResult({ success: false, message: 'Xác minh thất bại' });
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <PageLayout>
                <div className="pt-28 px-4 max-w-2xl mx-auto animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                    <div className="h-96 bg-gray-200 rounded-2xl" />
                </div>
            </PageLayout>
        );
    }

    if (error || !cert) {
        return (
            <PageLayout>
                <div className="pt-28 px-4 text-center">
                    <p className="text-gray-600">{error || 'Không tìm thấy chứng chỉ'}</p>
                    <Link to="/certificates" className="btn-primary mt-6 inline-flex">Về trang chứng chỉ</Link>
                </div>
            </PageLayout>
        );
    }

    const course = cert.course_id;
    const isValid = cert.status === 'active';

    return (
        <PageLayout>
            <div className="pt-24 pb-16 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="text-sm text-gray-500 mb-6">
                        <Link to="/certificates" className="hover:text-primary-600">Chứng chỉ</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{cert.certificate_number}</span>
                    </nav>

                    {/* Certificate Card */}
                    <div className={`rounded-2xl border-4 overflow-hidden shadow-xl ${isValid ? 'border-primary-500' : 'border-red-300'}`}>
                        {/* Header */}
                        <div className={`text-center py-10 px-8 ${isValid ? 'bg-gradient-to-br from-primary-600 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <div className="text-white/80 text-sm uppercase tracking-widest mb-2">E-Learning Platform</div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                {isValid ? 'Chứng nhận hoàn thành' : 'Chứng chỉ đã bị thu hồi'}
                            </h1>
                            <div className="text-white/60 text-sm">Certificate of Completion</div>
                        </div>

                        {/* Body */}
                        <div className="bg-white p-8 sm:p-12 text-center">
                            <p className="text-gray-500 mb-4">Được trao tặng cho</p>
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">
                                {cert.user_id?.name || 'Học viên'}
                            </h2>

                            <p className="text-gray-500 mb-2">đã hoàn thành khóa học</p>
                            <h3 className="text-xl font-semibold text-gray-900 mb-8">
                                {course?.title || 'Khóa học'}
                            </h3>

                            {course?.instructor_id?.name && (
                                <p className="text-gray-600 mb-8">
                                    Giảng viên: <span className="font-medium">{course.instructor_id.name}</span>
                                </p>
                            )}

                            {/* Certificate Details */}
                            <div className="inline-flex flex-col sm:flex-row gap-8 sm:gap-16 text-sm text-gray-600 mb-10">
                                <div>
                                    <p className="text-gray-400 mb-1">Ngày cấp</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(cert.issued_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 mb-1">Mã chứng chỉ</p>
                                    <p className="font-mono font-bold text-primary-600">{cert.certificate_number}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigator.clipboard.writeText(cert.certificate_number)}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    📋 Sao chép mã chứng chỉ
                                </button>
                                <Link
                                    to={`/courses/${course?._id}`}
                                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Xem lại khóa học
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Verification */}
                    <div className="mt-8 p-6 bg-white rounded-xl border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            🔍 Xác minh chứng chỉ
                        </h3>
                        {verifyResult ? (
                            <div className={`p-4 rounded-lg ${verifyResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <p className="font-medium">{verifyResult.success ? '✓ Chứng chỉ hợp lệ' : verifyResult.message}</p>
                                {verifyResult.success && verifyResult.data?.certificate && (
                                    <div className="mt-3 text-sm text-green-700 space-y-1">
                                        <p>Học viên: {verifyResult.data.certificate.user_name}</p>
                                        <p>Khóa học: {verifyResult.data.certificate.course_title}</p>
                                        <p>Ngày cấp: {new Date(verifyResult.data.certificate.issued_at).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                            >
                                {verifying ? 'Đang xác minh...' : 'Xác minh chứng chỉ'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
