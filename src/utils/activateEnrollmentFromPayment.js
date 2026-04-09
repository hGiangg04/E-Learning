const mongoose = require('mongoose');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const Payment = require('../models/payment.model');

function toObjectId(value) {
    if (value == null) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'object' && value._id != null) {
        return toObjectId(value._id);
    }
    const s = String(value).trim();
    if (!mongoose.Types.ObjectId.isValid(s)) return null;
    try {
        return new mongoose.Types.ObjectId(s);
    } catch {
        return null;
    }
}

async function persistPaymentEnrollmentId(paymentDocOrId, enrollmentId) {
    const pid = paymentDocOrId?._id ?? paymentDocOrId;
    const eid = toObjectId(enrollmentId);
    if (!pid || !eid) return;
    await Payment.updateOne({ _id: pid }, { $set: { enrollment_id: eid } });
    if (paymentDocOrId && typeof paymentDocOrId === 'object') {
        paymentDocOrId.enrollment_id = eid;
    }
}

/**
 * Kích hoạt đăng ký sau thanh toán thành công.
 * Idempotent: đã active thì không tăng student_count lần hai.
 */
async function activateEnrollmentFromPayment(payment) {
    const paymentId = payment?._id ?? payment?.id;
    const userId = toObjectId(payment.user_id);
    const courseId = toObjectId(payment.course_id);
    if (!paymentId || !userId || !courseId) return;

    let enrollment = null;
    if (payment.enrollment_id) {
        enrollment = await Enrollment.findById(payment.enrollment_id);
    }
    if (!enrollment) {
        enrollment = await Enrollment.findOne({ user_id: userId, course_id: courseId });
    }

    if (enrollment) {
        if (enrollment.status === 'pending') {
            enrollment.status = 'active';
            await enrollment.save();
            await Course.findByIdAndUpdate(enrollment.course_id, {
                $inc: { student_count: 1 }
            });
        }
        if (
            !payment.enrollment_id ||
            String(payment.enrollment_id) !== String(enrollment._id)
        ) {
            await persistPaymentEnrollmentId(payment, enrollment._id);
        }
        return;
    }

    try {
        enrollment = new Enrollment({
            user_id: userId,
            course_id: courseId,
            status: 'active'
        });
        await enrollment.save();
        await Course.findByIdAndUpdate(courseId, { $inc: { student_count: 1 } });
        await persistPaymentEnrollmentId(payment, enrollment._id);
    } catch (err) {
        if (err && err.code === 11000) {
            enrollment = await Enrollment.findOne({ user_id: userId, course_id: courseId });
            if (enrollment && enrollment.status === 'pending') {
                enrollment.status = 'active';
                await enrollment.save();
                await Course.findByIdAndUpdate(enrollment.course_id, {
                    $inc: { student_count: 1 }
                });
            }
            if (
                enrollment &&
                (!payment.enrollment_id ||
                    String(payment.enrollment_id) !== String(enrollment._id))
            ) {
                await persistPaymentEnrollmentId(payment, enrollment._id);
            }
            return;
        }
        throw err;
    }
}

module.exports = { activateEnrollmentFromPayment };
