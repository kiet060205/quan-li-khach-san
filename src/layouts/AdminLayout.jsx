import React, { useState } from 'react';
import { Layout, Menu, Typography, Badge, Avatar, Space, Dropdown, Popover, Button, Empty, Divider } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  SafetyCertificateOutlined,
  BellOutlined,
  UserOutlined,
  DeleteOutlined,
  ClearOutlined,
  BankOutlined // <-- THÊM CÁI NÀY
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Import useAuthStore lên đầu file
import { useAuthStore } from '../store/authStore';
import { useNotification } from '../context/notificationContext';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, removeNotification, clearAllNotifications } = useNotification();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // ================= CẢI TIẾN Ở ĐÂY =================
  // Lôi thông tin user hiện tại từ "Kho" ra để dùng
  const { user } = useAuthStore(); 
  // ===================================================

  // Danh sách các menu bên trái
  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/users', icon: <TeamOutlined />, label: 'Danh sách Nhân sự' },
    { key: '/admin/rooms', icon: <BankOutlined />, label: 'Quản lý phòng' },
    { key: '/admin/roles', icon: <SafetyCertificateOutlined />, label: 'Vai trò & Phân quyền' },
  ];

  // Hàm để lấy màu icon dựa trên type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info':
      default: return '#1890ff';
    }
  };

  // Content của Popover - hiển thị danh sách thông báo
  const notificationContent = (
    <div style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <Empty description="Không có thông báo nào" style={{ margin: '20px 0' }} />
      ) : (
        <div>
          {notifications.map((notif, index) => (
            <div key={notif.id}>
              <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getNotificationColor(notif.type),
                      }}
                    />
                    <Text strong style={{ color: '#000' }}>
                      {notif.title}
                    </Text>
                  </div>
                  <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    {notif.description}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {notif.timestamp.toLocaleTimeString('vi-VN')}
                  </Text>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeNotification(notif.id)}
                  style={{ marginLeft: '8px', color: '#999' }}
                />
              </div>
              {index < notifications.length - 1 && <Divider style={{ margin: '8px 0' }} />}
            </div>
          ))}
          
          {notifications.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
              <Button
                type="text"
                danger
                size="small"
                icon={<ClearOutlined />}
                onClick={clearAllNotifications}
                block
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* CỘT MENU BÊN TRÁI (SIDEBAR) */}
      <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ color: '#1890ff', margin: 0 }}>STK6</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]} // Tự động bôi xanh menu đang đứng
          items={menuItems}
          onClick={(e) => navigate(e.key)} // Chuyển trang khi click
          style={{ borderRight: 0, marginTop: '10px' }}
        />
      </Sider>

      {/* KHU VỰC BÊN PHẢI */}
      <Layout>
        {/* THANH ĐIỀU HƯỚNG PHÍA TRÊN (HEADER) */}
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Space size="large">
            {/* Cái chuông thông báo với Popover */}
            <Popover
              content={notificationContent}
              title={`Thông báo (${notifications.length})`}
              trigger="click"
              placement="bottomRight"
              open={isNotificationOpen}
              onOpenChange={setIsNotificationOpen}
            >
              <Badge count={notifications.length} overflowCount={99} style={{ backgroundColor: '#ff4d4f' }}>
                <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
              </Badge>
            </Popover>
            
            {/* Dropdown bọc Avatar để làm nút Đăng xuất */}
            <Dropdown 
              menu={{
                items: [
                  { 
                    key: 'logout', 
                    danger: true, 
                    label: 'Đăng xuất',
                    onClick: () => {
                      useAuthStore.getState().clearAuth(); // Xóa token
                      navigate('/login'); // Đá văng ra ngoài trang Login
                    }
                  }
                ]
              }} 
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                {/* ================= CẢI TIẾN Ở ĐÂY ================= */}
                {/* Tự động tạo ảnh đại diện dựa trên tên của người dùng */}
                <Avatar icon={<UserOutlined />} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Guest'}`} />
                
                {/* Hiển thị tên và vai trò động từ Token */}
                <Text strong>{user?.name || 'Khách'} ({user?.role || 'Chưa rõ'})</Text>
                {/* =================================================== */}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* NỘI DUNG CHÍNH (Thay đổi tùy theo Menu được chọn) */}
        <Content style={{ margin: '24px', background: '#f5f5f5' }}>
          {/* Outlet chính là nơi React Router sẽ "bơm" các trang con vào */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;