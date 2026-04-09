import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import InstructorHeader from './InstructorHeader';

export default function InstructorLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.role || (userData.role !== 'instructor' && userData.role !== 'admin')) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <InstructorHeader sidebarCollapsed={sidebarCollapsed} />
      
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}