import axios from './axios';

export const certificateService = {
    // Lấy chứng chỉ của user
    getMyCertificates: async () => {
        const res = await axios.get('/certificates/my');
        return res.data;
    },

    // Lấy chi tiết chứng chỉ
    getCertificateDetail: async (certNumber) => {
        const res = await axios.get(`/certificates/${certNumber}`);
        return res.data;
    },

    // Xác minh chứng chỉ
    verifyCertificate: async (certNumber) => {
        const res = await axios.get(`/certificates/verify/${certNumber}`);
        return res.data;
    },

    // Kiểm tra và cấp chứng chỉ
    checkAndIssue: async (courseId) => {
        const res = await axios.post('/certificates/check', { course_id: courseId });
        return res.data;
    }
};
