import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      // Mock data
      setEnrollments([
        { _id: '1', user: { name: 'Nguyễn Văn A', email: 'vana@gmail.com' }, course: { title: 'React cơ bản' }, enrolledAt: '2024-01-15', status: 'active', progress: 75 },
        { _id: '2', user: { name: 'Trần Thị B', email: 'thib@gmail.com' }, course: { title: 'Node.js Advanced' }, enrolledAt: '2024-01-14', status: 'active', progress: 45 },
        { _id: '3', user: { name: 'Lê Văn C', email: 'vanc@gmail.com' }, course: { title: 'Python for Data Science' }, enrolledAt: '2024-01-13', status: 'pending', progress: 0 },
        { _id: '4', user: { name: 'Phạm Thị D', email: 'thid@gmail.com' }, course: { title: 'Docker & Kubernetes' }, enrolledAt: '2024-01-12', status: 'active', progress: 90 },
        { _id: '5', user: { name: 'Hoàng Văn E', email: 'vane@gmail.com' }, course: { title: 'TypeScript Masterclass' }, enrolledAt: '2024-01-11', status: 'cancelled', progress: 0 },
        { _id: '6', user: { name: 'Đặng Thị F', email: 'thif@gmail.com' }, course: { title: 'MongoDB Fundamentals' }, enrolledAt: '2024-01-10', status: 'active', progress: 30 },
        { _id: '7', user: { name: 'Bùi Văn G', email: 'vang@gmail.com' }, course: { title: 'React cơ bản' }, enrolledAt: '2024-01-09', status: 'pending', progress: 0 },
        { _id: '8', user: { name: 'Ngô Thị H', email: 'thih@gmail.com' }, course: { title: 'Python for Data Science' }, enrolledAt: '2024-01-08', status: 'active', progress: 60 },
      ]);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Học viên',
      render: (value) => (
        <div>
          <span className="font-medium text-gray-900">{value.name}</span>
          <p className="text-xs text-gray-500">{value.email}</p>
        </div>
      ),
    },
    { key: 'course', label: 'Khóa học', render: (value) => <span className="font-medium">{value.title}</span> },
    { key: 'enrolledAt', label: 'Ngày đăng ký' },
    {
      key: 'progress',
      label: 'Tiến độ',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full" style={{ width: `${value}%` }}></div>
          </div>
          <span className="text-sm text-gray-600">{value}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { active: 'Đang học', pending: 'Chờ duyệt', cancelled: 'Đã hủy', completed: 'Hoàn thành' };
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          cancelled: 'bg-red-100 text-red-800',
          completed: 'bg-blue-100 text-blue-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
  ];

  const handleApprove = (enrollment) => {
    setEnrollments(enrollments.map((e) => (e._id === enrollment._id ? { ...e, status: 'active' } : e)));
  };

  const handleCancel = (enrollment) => {
    if (window.confirm('Bạn có chắc muốn hủy đăng ký này?')) {
      setEnrollments(enrollments.map((e) => (e._id === enrollment._id ? { ...e, status: 'cancelled' } : e)));
    }
  };

  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký</h1>
          <p className="text-gray-500">Quản lý đăng ký khóa học của học viên</p>
        </div>

        <DataTable
          title="Danh sách đăng ký"
          columns={columns}
          data={enrollments}
          onView={handleView}
          onDelete={handleCancel}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEnrollment(null);
          }}
          title="Chi tiết đăng ký"
        >
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Học viên</label>
                  <p className="font-medium">{selectedEnrollment.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedEnrollment.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Khóa học</label>
                  <p className="font-medium">{selectedEnrollment.course.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Ngày đăng ký</label>
                  <p className="font-medium">{selectedEnrollment.enrolledAt}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Trạng thái</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedEnrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedEnrollment.status === 'active' ? 'Đang học' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tiến độ học tập</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${selectedEnrollment.progress}%` }}></div>
                  </div>
                  <span className="font-medium">{selectedEnrollment.progress}%</span>
                </div>
              </div>
              {selectedEnrollment.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleCancel(selectedEnrollment);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Hủy đăng ký
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedEnrollment);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Duyệt đăng ký
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
