import api from './axios';

export async function fetchAdminPayments() {
  const { data } = await api.get('/payments/admin');
  return data.data?.payments ?? [];
}

export async function updatePaymentAdmin(id, decision) {
  const { data } = await api.patch(`/payments/admin/${id}`, { decision });
  return data.data?.payment;
}

/** Sửa payment completed nhưng chưa gắn enrollment_id (dữ liệu cũ) */
export async function syncCompletedPaymentEnrollments() {
  const { data } = await api.post('/payments/sync-completed-enrollments');
  return data;
}
