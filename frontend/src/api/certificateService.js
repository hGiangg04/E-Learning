import api from './axios';

export const certificateService = {
    getMyCertificates: () => api.get('/certificates/my').then(r => r.data),
    checkCertificate: (courseId) => api.get(`/certificates/check/${courseId}`).then(r => r.data),
    generateCertificate: (courseId) => api.post('/certificates/generate', { course_id: courseId }).then(r => r.data),
    verifyCertificate: (certNumber) => api.get(`/certificates/verify/${certNumber}`).then(r => r.data),
};
