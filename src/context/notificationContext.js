import React, { createContext, useContext, useState, useCallback } from 'react';

// Tạo Context
const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Thêm thông báo mới
  const addNotification = useCallback((title, description, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      description,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date(),
    };
    
    setNotifications((prev) => [newNotification, ...prev]);

    // Tự động xóa thông báo sau 30 giây
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 30000);

    return newNotification.id;
  }, []);

  // Xóa thông báo
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Xóa tất cả thông báo
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return React.createElement(
    NotificationContext.Provider,
    { value },
    children
  );
};

// Custom Hook để dùng Notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification phải được dùng trong NotificationProvider');
  }
  return context;
};
