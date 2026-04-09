import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import CourseCard from '../components/CourseCard';
import { instructorService } from '../api/instructorService';
import toast from 'react-hot-toast';

const StarIcon = () => (
    <svg className="w-5 h-5 fill-current text-yellow-400" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const BookIcon = () => (
    <svg className="w-5 h-5 fill-none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long'
    });
}

export default function InstructorProfilePage() {
    const { id } = useParams();
    const [instructor, setInstructor] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        instructorService
            .getProfile(id)
            .then((res) => {
                if (cancelled) return;
                const body = res?.data;
                if (body?.success && body.data?.instructor) {
                    setInstructor(body.data.instructor);
                    setCourses(body.data.courses || []);
                } else {
                    setInstructor(null);
                    setCourses([]);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                const msg = err.response?.data?.message || 'Không tải được hồ sơ giảng viên';
                toast.error(msg, { id: `instructor-${id}` });
                setInstructor(null);
                setCourses([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <PageLayout>
                <div className="pt-28 px-4 max-w-5xl mx-auto animate-pulse space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-1/3" />
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                        </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-gray-200 rounded-xl" />
                        <div className="h-20 bg-gray-200 rounded-xl" />
                        <div className="h-20 bg-gray-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl" />)}
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (!instructor) {
        return (
            <PageLayout>
                <div className="pt-28 px-4 text-center">
                    <p className="text-gray-600">Không tìm thấy giảng viên.</p>
                    <Link to="/courses" className="btn-primary mt-6 inline-flex">
                        Về danh sách khóa học
                    </Link>
                </div>
            </PageLayout>
        );
    }

    const { stats = {} } = instructor;
    const joinedAt = formatDate(instructor.created_at);

    return (
        <PageLayout>
            <div className="pt-20 pb-16 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="text-sm text-gray-500 mb-8">
                        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">Giảng viên</span>
                    </nav>

                    {/* Instructor header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
                        {/* Avatar */}
                        <div className="shrink-0">
                            {instructor.avatar ? (
                                <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-50"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-primary-50">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {instructor.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-gray-900">{instructor.name}</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Giảng viên {joinedAt ? ` · Tham gia từ ${joinedAt}` : ''}
                            </p>
                            {instructor.bio && (
                                <p className="mt-4 text-gray-600 leading-relaxed">{instructor.bio}</p>
                            )}
                            {instructor.address && (
                                <p className="mt-2 text-sm text-gray-500">
                                    📍 {instructor.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                                <BookIcon />
                                <span className="text-2xl font-bold text-gray-900">{stats.total_courses || 0}</span>
                            </div>
                            <p className="text-sm text-gray-500">Khóa học</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-1 text-primary-500 mb-2">
                                <UsersIcon />
                                <span className="text-2xl font-bold text-gray-900">{stats.total_students || 0}</span>
                            </div>
                            <p className="text-sm text-gray-500">Học viên</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-2">
                                <StarIcon />
                                <span className="text-2xl font-bold text-gray-900">{stats.average_rating || 0}</span>
                            </div>
                            <p className="text-sm text-gray-500">Đánh giá TB</p>
                        </div>
                    </div>

                    {/* Course list */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            Các khóa học ({courses.length})
                        </h2>
                        {courses.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Giảng viên chưa có khóa học nào.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(course => (
                                    <CourseCard
                                        key={course._id}
                                        course={course}
                                        showWishlist={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
