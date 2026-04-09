import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { fetchAdminPayments, updatePaymentAdmin, syncCompletedPaymentEnrollments } from '../../api/paymentService';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const list = await fetchAdminPayments();
      setPayments(list);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error.response?.data?.message || 'Không tải được danh sách thanh toán');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEnrollments = async () => {
    try {
      const res = await syncCompletedPaymentEnrollments();
      const d = res?.data;
      toast.success(
        `Đã xử lý ${d?.processed ?? 0} đơn. Còn ${d?.still_missing_enrollment_id ?? 0} bản ghi chưa gắn enrollment.`
      );
      await fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đồng bộ thất bại');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      key: 'user',
      label: 'Người thanh toán',
      render: (value) => (
        <div>
          <span className="font-medium text-gray-900">{value.name}</span>
          <p className="text-xs text-gray-500">{value.email}</p>
        </div>
      ),
    },
    { key: 'course', label: 'Khóa học', render: (value) => <span className="font-medium">{value.title}</span> },
    {
      key: 'amount',
      label: 'Số tiền',
      render: (value) => <span className="font-medium text-primary-600">{formatCurrency(value)}</span>,
    },
    {
      key: 'method',
      label: 'Phương thức',
      render: (value) => {
        const methods = {
          banking: 'Chuyển khoản',
          vnpay: 'VNPay',
          momo: 'MoMo',
          pending: 'Chưa chọn / chờ',
        };
        return <span className="text-gray-700">{methods[value] || value}</span>;
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      badge: true,
      render: (value) => {
        const statusLabels = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối' };
        const statusColors = {
          approved: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {statusLabels[value]}
          </span>
        );
      },
    },
    { key: 'createdAt', label: 'Ngày thanh toán' },
  ];

  const handleApprove = async (payment) => {
    try {
      const updated = await updatePaymentAdmin(payment._id, 'approve');
      if (updated) {
        setPayments((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        toast.success('Đã duyệt thanh toán');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Duyệt thất bại');
    }
  };

  const handleReject = async (payment) => {
    if (!window.confirm('Bạn có chắc muốn từ chối thanh toán này?')) return;
    try {
      const updated = await updatePaymentAdmin(payment._id, 'reject');
      if (updated) {
        setPayments((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        toast.success('Đã từ chối thanh toán');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Từ chối thất bại');
    }
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý thanh toán</h1>
            <p className="text-gray-500">Duyệt và quản lý các giao dịch thanh toán</p>
          </div>
          <button
            type="button"
            onClick={handleSyncEnrollments}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors shrink-0"
          >
            Đồng bộ ghi danh (sửa đơn completed thiếu liên kết)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === 'approved').length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Danh sách thanh toán"
          columns={columns}
          data={payments}
          onView={handleView}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
          }}
          title="Chi tiết thanh toán"
        >
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Người thanh toán</label>
                  <p className="font-medium">{selectedPayment.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedPayment.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Khóa học</label>
                  <p className="font-medium">{selectedPayment.course.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Số tiền</label>
                  <p className="text-xl font-bold text-primary-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phương thức</label>
                  <p className="font-medium">
                    {selectedPayment.method === 'banking'
                      ? 'Chuyển khoản'
                      : selectedPayment.method === 'pending'
                        ? 'Chưa chọn / chờ'
                        : String(selectedPayment.method || '').toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Ngày thanh toán</label>
                  <p className="font-medium">{selectedPayment.createdAt}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Trạng thái</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedPayment.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedPayment.status === 'approved' ? 'Đã duyệt' : selectedPayment.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </span>
                </div>
              </div>
              {selectedPayment.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleReject(selectedPayment);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedPayment);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Duyệt thanh toán
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
