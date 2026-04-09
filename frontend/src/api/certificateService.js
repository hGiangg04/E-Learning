import api from './axios';

export const certificateService = {
    /** GET /api/certificates/my — danh sách chứng chỉ của tôi */
    getMyCertificates: () =>
        api.get('/certificates/my').then(r => r.data),

    /** GET /api/certificates/check/:courseId — kiểm tra có chứng chỉ cho khóa này */
    checkCertificate: (courseId) =>
        api.get(`/certificates/check/${courseId}`).then(r => r.data),

    /** POST /api/certificates/generate — yêu cầu cấp chứng chỉ */
    generateCertificate: (courseId) =>
        api.post('/certificates/generate', { course_id: courseId }).then(r => r.data),

    /** GET /api/certificates/verify/:certNumber — xác minh công khai */
    verifyCertificate: (certNumber) =>
        api.get(`/certificates/verify/${certNumber}`).then(r => r.data),
};
