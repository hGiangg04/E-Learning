import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/instructor/InstructorLayout';
import StatCard from '../../components/instructor/StatCard';
import { instructorDashboardApi } from '../../api/instructorDashboardApi';
import toast from 'react-hot-toast';

const RevenueIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function InstructorRevenuePage() {
  const [revenue, setRevenue] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await instructorDashboardApi.getRevenue({ period });

      if (res.data.success) {
        setRevenue(res.data.data.revenue || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doanh thu</h1>
            <p className="text-gray-500">Thống kê doanh thu từ các khóa học</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">1 năm</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title={`Tổng doanh thu (${period === 'week' ? '7 ngày' : period === 'month' ? '30 ngày' : '1 năm'})`}
            value={formatCurrency(total)}
            icon={<RevenueIcon />}
            color="green"
          />
          <StatCard
            title="Số giao dịch"
            value={revenue.reduce((sum, r) => sum + r.count, 0)}
            icon={<ChartIcon />}
            color="blue"
          />
        </div>

        {/* Chart placeholder - simple bar visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ doanh thu</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : revenue.length > 0 ? (
            <div className="space-y-2">
              {revenue.map((item, index) => {
                const maxAmount = Math.max(...revenue.map(r => r.amount));
                const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 w-24 shrink-0">{formatDate(item._id)}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-32 text-right">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Không có dữ liệu doanh thu trong khoảng thời gian này
            </div>
          )}
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết doanh thu</h3>
          </div>
          {revenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số giao dịch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenue.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{formatDate(item._id)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{item.count}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-green-600">{formatCurrency(item.amount)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              Không có dữ liệu doanh thu
            </div>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}