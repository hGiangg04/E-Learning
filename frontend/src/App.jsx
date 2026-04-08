import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import './index.css';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EnrollmentManagement from './pages/admin/EnrollmentManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import QuizManagement from './pages/admin/QuizManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/enrollments" element={<EnrollmentManagement />} />
        <Route path="/admin/payments" element={<PaymentManagement />} />
        <Route path="/admin/quizzes" element={<QuizManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
