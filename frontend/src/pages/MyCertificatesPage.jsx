import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { certificateService } from '../api';

const IconBadge = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

export default function MyCertificatesPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewCert, setPreviewCert] = useState(null);

    useEffect(() => {
        if (!token) { toast.error('Vui lòng đăng nhập'); navigate('/login'); return; }
        let cancelled = false;
        setLoading(true);
        certificateService.getMyCertificates()
            .then(res => { if (!cancelled && res?.success) setCerts(res.data?.certificates ?? []); })
            .catch(() => toast.error('Không tải được danh sách chứng chỉ'))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, navigate]);

    const handleDownload = (cert) => {
        const el = document.getElementById('cert-preview');
        if (!el) return;
        const w = window.open('', '_blank', 'width=900,height=640');
        if (!w) { toast.error('Trình duyệt chặn cửa sổ bật lên'); return; }
        const course = cert.course_id || {};
        const user = cert.user_id || {};
        w.document.write(`<html><head><title>Chứng chỉ - ${cert.certificate_number}</title>
        <style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f4ff;font-family:Arial,sans-serif}#cert{width:800px;aspect-ratio:1.414/1;background:linear-gradient(135deg,#eff6ff,#fff);border:8px solid #6366f1;border-radius:8px;padding:40px;box-sizing:border-box;text-align:center;position:relative}#cert::before{content:'';position:absolute;inset:12px;border:2px solid #818cf8;border-radius:4px;pointer-events:none}#cert::after{content:'';position:absolute;inset:20px;border:1px dashed #a5b4fc;border-radius:4px;pointer-events:none}.icon{width:56px;height:56px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;color:white}h2{color:#4338ca;margin:8px 0 4px;font-size:24px}h3{color:#6d28d9;font-size:14px;letter-spacing:0.2em}h4{color:#374151;font-size:13px}h1{color:#1f2937;font-size:20px;max-width:400px;margin:12px auto}h1 span{display:block;font-size:16px;font-weight:normal;color:#6b7280;margin-top:4px}.meta{display:flex;justify-content:center;gap:32px;margin-top:16px;font-size:12px;color:#6b7280}.line{width:60px;height:2px;background:#818cf8;margin:12px auto}</style></head>
        <body><div id="cert">
            <div class="icon">&#10003;</div>
            <h3>E-LEARNING PLATFORM</h3>
            <h2>CHỨNG CHỈ HOÀN THÀNH</h2>
            <h4>Certificate of Completion</h4>
            <div class="line"></div>
            <h4>Được cấp cho</h4>
            <h1>${user.name || 'Học viên'}<span>đã hoàn thành khóa học</span></h1>
            <h1 style="font-size:16px">${course.title || 'Khóa học'}</h1>
            <div class="meta">
                <div><strong>${new Date(cert.issued_at).toLocaleDateString('vi-VN')}</strong><br/>Ngày cấp</div>
                <div><strong>${cert.certificate_number}</strong><br/>Mã chứng chỉ</div>
                <div><strong>${cert.completion_percentage || 0}%</strong><br/>Hoàn thành</div>
            </div>
        </div></body></html>`);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    return (
        <PageLayout>
            <div className="pt-24 pb-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                            <IconBadge />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chứng chỉ của tôi</h1>
                            <p className="text-sm text-gray-500">Danh sách chứng chỉ đã nhận</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-primary-600">{certs.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Chứng chỉ đã nhận</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-emerald-600">{certs.filter(c => c.completion_percentage >= 100).length}</p>
                            <p className="text-xs text-gray-500 mt-1">Hoàn thành 100%</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-gray-700">{new Set(certs.map(c => String(c.course_id?._id || c.course_id))).size}</p>
                            <p className="text-xs text-gray-500 mt-1">Khóa học được cấp</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
                    ) : certs.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4"><IconBadge /></div>
                            <h3 className="font-semibold text-gray-700 mb-1">Chưa có chứng chỉ nào</h3>
                            <p className="text-sm text-gray-500 mb-4">Hoàn thành khóa học để nhận chứng chỉ.</p>
                            <Link to="/courses" className="inline-flex px-5 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium">Khám phá khóa học</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {certs.map(cert => {
                                const course = cert.course_id || {};
                                return (
                                    <div key={cert._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="relative h-28 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                                            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                                                <span className="text-6xl font-bold text-white">CERT</span>
                                            </div>
                                            <div className="relative text-center text-white">
                                                <div className="flex justify-center mb-1"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><IconBadge /></div></div>
                                                <p className="text-[10px] tracking-widest opacity-80">CHỨNG CHỈ HOÀN THÀNH</p>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{course.title || 'Khóa học'}</h3>
                                            <p className="text-xs text-gray-500 mb-3">Mã: <span className="font-mono font-medium">{cert.certificate_number}</span></p>
                                            <p className="text-xs text-gray-500 mb-4">Ngày cấp: {new Date(cert.issued_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Tiến độ</span><span className="font-medium">{cert.completion_percentage || 0}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${cert.completion_percentage || 0}%` }} /></div>
                                            </div>
                                            <button onClick={() => handleDownload(cert)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Tải PDF
                                            </button>
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
