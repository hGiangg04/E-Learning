const Course = require('../models/course.model');

/**
 * Khớp GET /api/courses/:id — ObjectId 24 ký tự hex hoặc slug.
 */
async function resolveCourseByParam(param) {
  const p = String(param || '').trim();
  if (!p) return null;
  const isOid = /^[a-fA-F0-9]{24}$/.test(p);
  let course = null;
  if (isOid) {
    course = await Course.findById(p).select('_id');
  }
  if (!course) {
    course = await Course.findOne({ slug: p }).select('_id');
  }
  return course;
}

module.exports = { resolveCourseByParam };
