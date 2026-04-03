import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import RoleManagePage from './pages/admin/roles/RoleManagePage';
import UserManagementPage from './pages/admin/UserManagement/UserManagementPage';
import RoomManagementPage from './pages/admin/RoomManagement/RoomManagementPage';
import RoomCreatePage from './pages/admin/RoomManagement/RoomCreatePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HousekeepingPage from './pages/admin/Housekeeping/HousekeepingPage'; // Trỏ đúng đường dẫn file của bro nha
import { useAuthStore } from './store/authStore';
import { NotificationProvider } from './context/notificationContext';
import 'antd/dist/reset.css'; 

// Component "Bảo vệ": Kiểm tra có token chưa, chưa có đá về /login
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/roles" replace />} />
          
          {/* Các trang công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Cụm trang Admin được bọc bằng ProtectedRoute */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="roles" element={<RoleManagePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="rooms" element={<RoomManagementPage />} />
            <Route path="rooms/create" element={<RoomCreatePage />} />
            <Route path="housekeeping" element={<HousekeepingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;