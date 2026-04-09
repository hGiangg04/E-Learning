import api from './axios';

export const commentService = {
    /** GET /api/comments?target_type=course&target_id=... */
    getComments: (targetType, targetId, params = {}) =>
        api.get('/comments', { params: { target_type: targetType, target_id: targetId, ...params } })
            .then(r => r.data),

    /** POST /api/comments — gửi bình luận */
    postComment: (payload) =>
        api.post('/comments', payload).then(r => r.data),

    /** DELETE /api/comments/:id */
    deleteComment: (id) =>
        api.delete(`/comments/${id}`).then(r => r.data),
};
