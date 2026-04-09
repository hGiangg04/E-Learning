import api from './axios';

export const commentService = {
    getComments: (targetType, targetId, params = {}) =>
        api.get('/comments', { params: { target_type: targetType, target_id: targetId, ...params } }).then(r => r.data),
    postComment: (payload) => api.post('/comments', payload).then(r => r.data),
    deleteComment: (id) => api.delete(`/comments/${id}`).then(r => r.data),
};
