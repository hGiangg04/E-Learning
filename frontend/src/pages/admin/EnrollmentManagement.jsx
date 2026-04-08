import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { adminApi } from '../../api/adminApi';

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'pending'

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      let response;
      if (viewMode === 'pending') {
        response = await adminApi.getPendingEnrollments();
      } else {
        response = await adminApi.getEnrollments();
      }
      
      if (response.data.success) {
        const data = viewMode === 'pending' 
          ? response.data.data.enrollments 
          : response.data.data.enrollments || [];
        setEnrollments(data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Không thể tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [viewMode]);

  const columns = [
    {
      key: 'user_id',
      label: 'Học viên',
      render: (value) => (
        <div>
          <span className="font-medium text-gray-900">{value?.name || '-'}</span>
          <p className="text-xs text-gray-500">{value?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'course_id',
      label: 'Khóa học',
      render: (value) => <span className="font-medium">{value?.title || '-'}</span>,
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
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[value] || value}
          </span>
        );
      },
    },
    {
      key: 'enrolled_at',
      label: 'Ngày đăng ký',
      render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-',
    },
  ];

  const handleApprove = async (enrollment) => {
    try {
      const response = await adminApi.approveEnrollment(enrollment._id);
      if (response.data.success) {
        toast.success('Đã duyệt đăng ký');
        fetchEnrollments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể duyệt đăng ký');
    }
  };

  const handleCancel = async (enrollment) => {
    if (window.confirm('Bạn có chắc muốn hủy đăng ký này?')) {
      try {
        // Use enrollment._id or course_id depending on API
        const response = await adminApi.cancelEnrollment(enrollment.course_id?._id || enrollment.course_id);
        if (response.data.success) {
          toast.success('Đã hủy đăng ký');
          fetchEnrollments();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể hủy đăng ký');
      }
    }
  };

  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký</h1>
            <p className="text-gray-500">Quản lý đăng ký khóa học của học viên</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setViewMode('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'pending' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ duyệt
            </button>
          </div>
        </div>

        <DataTable
          title={viewMode === 'pending' ? 'Danh sách đăng ký chờ duyệt' : 'Danh sách đăng ký'}
          columns={columns}
          data={enrollments}
          onView={handleView}
          onDelete={handleCancel}
          loading={loading}
          customActions={
            viewMode === 'pending' 
              ? [{ label: 'Duyệt', onClick: handleApprove, color: 'green' }]
              : []
          }
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
                  <p className="font-medium">{selectedEnrollment.user_id?.name || '-'}</p>
                  <p className="text-sm text-gray-600">{selectedEnrollment.user_id?.email || ''}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Khóa học</label>
                  <p className="font-medium">{selectedEnrollment.course_id?.title || '-'}</p>
                  <p className="text-sm text-gray-600">
                    {selectedEnrollment.course_id?.price 
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedEnrollment.course_id.price)
                      : 'Miễn phí'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Ngày đăng ký</label>
                  <p className="font-medium">
                    {selectedEnrollment.enrolled_at 
                      ? new Date(selectedEnrollment.enrolled_at).toLocaleDateString('vi-VN')
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Trạng thái</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedEnrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedEnrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedEnrollment.status === 'active' ? 'Đang học' :
                     selectedEnrollment.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                  </span>
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
