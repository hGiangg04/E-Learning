import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { certificateService } from '../api';

/* ─── Icon components ─── */
const IconBadge = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/* ─── Single certificate card ─── */
function CertificateCard({ cert, onView }) {
  const course = cert.course_id || {};
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="80" fontWeight="bold" fill="white" opacity="0.3">CERT</text>
          </svg>
        </div>
        <div className="relative text-center text-white">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <IconBadge />
            </div>
          </div>
          <p className="text-xs font-medium tracking-widest opacity-80">CHỨNG CHỈ HOÀN THÀNH</p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">{course.title || 'Khóa học'}</h3>
        <p className="text-xs text-gray-500 mb-3">Mã: <span className="font-mono font-medium text-gray-700">{cert.certificate_number}</span></p>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span>Ngày cấp: {new Date(cert.issued_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {cert.completion_percentage != null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tiến độ hoàn thành</span>
              <span className="font-medium text-gray-700">{cert.completion_percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${cert.completion_percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onView(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
          >
            <IconEye /> Xem
          </button>
          <button
            onClick={() => onView(cert, true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <IconDownload /> Tải PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Certificate Viewer Modal ─── */
function CertificateModal({ cert, onClose, onDownload }) {
  if (!cert) return null;
  const course = cert.course_id || {};
  const user = cert.user_id || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate preview (print-friendly) */}
        <div id="cert-preview" className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 p-8 text-center border-8 border-primary-200" style={{ aspectRatio: '1.414 / 1' }}>
          {/* Decorative border */}
          <div className="absolute inset-3 border-2 border-primary-300 rounded-sm pointer-events-none" />
          <div className="absolute inset-6 border border-dashed border-primary-300 rounded-sm pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center h-full gap-2">
            <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center mb-1 shadow-lg">
              <IconBadge />
            </div>
            <p className="text-xs font-medium tracking-[0.3em] text-primary-500 uppercase">E-Learning Platform</p>
            <h2 className="text-2xl font-bold text-primary-800 mt-1">Chứng Chỉ Hoàn Thành</h2>
            <p className="text-sm text-gray-500 mt-1">Certificate of Completion</p>

            <div className="my-4 w-16 h-0.5 bg-primary-300 rounded" />

            <p className="text-sm text-gray-600">Được cấp cho</p>
            <p className="text-xl font-bold text-gray-900">{user.name || 'Học viên'}</p>

            <p className="text-sm text-gray-600 mt-2">đã hoàn thành khóa học</p>
            <p className="text-lg font-semibold text-gray-800 max-w-xs line-clamp-2">{course.title || 'Khóa học'}</p>

            <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
              <div>
                <p className="font-medium text-gray-700">{new Date(cert.issued_at).toLocaleDateString('vi-VN')}</p>
                <p>Ngày cấp</p>
              </div>
              <div>
                <p className="font-mono font-medium text-gray-700">{cert.certificate_number}</p>
                <p>Mã chứng chỉ</p>
              </div>
              {cert.completion_percentage != null && (
                <div>
                  <p className="font-medium text-gray-700">{cert.completion_percentage}%</p>
                  <p>Hoàn thành</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-100 transition-colors">
            Đóng
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <IconDownload /> Tải PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MyCertificatesPage() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!token) {
      toast.error('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    let cancelled = false;
    setLoading(true);
    certificateService.getMyCertificates()
      .then(res => { if (!cancelled && res?.success) setCertificates(res.data?.certificates ?? []); })
      .catch(() => toast.error('Không tải được danh sách chứng chỉ'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, navigate]);

  const handleDownload = (cert, openPrint = false) => {
    setSelectedCert(cert);
    if (openPrint) {
      setTimeout(() => {
        const content = document.getElementById('cert-preview');
        if (!content) return;
        const w = window.open('', '_blank', 'width=900,height=640');
        if (!w) { toast.error('Trình duyệt chặn cửa sổ bật lên'); return; }
        w.document.write(`
          <html><head><title>Chứng chỉ - ${cert.certificate_number}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f0f4ff; }
            #cert-preview { width: 800px; aspect-ratio: 1.414/1; }
            @media print { body { background: white; } }
          </style></head>
          <body>${content.outerHTML}</body></html>
        `);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
      }, 300);
    }
  };

  return (
    <PageLayout>
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <IconBadge />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chứng chỉ của tôi</h1>
              <p className="text-sm text-gray-500">Danh sách chứng chỉ bạn đã nhận được</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary-600">{certificates.length}</p>
              <p className="text-xs text-gray-500 mt-1">Chứng chỉ đã nhận</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {certificates.filter(c => c.completion_percentage >= 100).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Hoàn thành 100%</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-4 border border-gray-100 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-700">
                {new Set(certificates.map(c => String(c.course_id?._id || c.course_id))).size}
              </p>
              <p className="text-xs text-gray-500 mt-1">Khóa học được cấp</p>
            </div>
          </div>

          {/* Certificate list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <IconBadge />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Chưa có chứng chỉ nào</h3>
              <p className="text-sm text-gray-500 mb-4">Hoàn thành khóa học để nhận chứng chỉ của bạn.</p>
              <Link to="/courses" className="inline-flex px-5 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {certificates.map(cert => (
                <CertificateCard key={cert._id} cert={cert} onView={handleDownload} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCert && (
        <CertificateModal
          cert={selectedCert}
          onClose={() => setSelectedCert(null)}
          onDownload={() => handleDownload(selectedCert, true)}
        />
      )}
    </PageLayout>
  );
}
