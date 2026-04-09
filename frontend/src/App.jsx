import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonLearnPage from './pages/LessonLearnPage';
import AboutPage from './pages/AboutPage';
import CategoriesPage from './pages/CategoriesPage';
import ProfilePage from './pages/ProfilePage';
import MyCoursesPage from './pages/MyCoursesPage';
import MyCertificatesPage from './pages/MyCertificatesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import LessonManagement from './pages/admin/LessonManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EnrollmentManagement from './pages/admin/EnrollmentManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import QuizManagement from './pages/admin/QuizManagement';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId/lesson/:lessonId" element={<LessonLearnPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
        <Route path="/my-certificates" element={<ProtectedRoute><MyCertificatesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute><CourseManagement /></ProtectedRoute>} />
        <Route path="/admin/lessons" element={<ProtectedRoute><LessonManagement /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><CategoryManagement /></ProtectedRoute>} />
        <Route path="/admin/enrollments" element={<ProtectedRoute><EnrollmentManagement /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
        <Route path="/admin/quizzes" element={<ProtectedRoute><QuizManagement /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
