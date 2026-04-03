import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Drawer, Checkbox, Space, Divider } from 'antd';
import { SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons';
import { roleApi } from '../../../api/roleApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

// TẠM THỜI: Tạo danh sách quyền giả lập (Vì Backend của bạn chưa có API lấy danh sách Permission)
// Chú ý: Value ở đây chính là PermissionId trong Database của bạn. Bạn hãy sửa các số 1,2,3,4 này cho khớp với ID trong bảng Permissions SQL nhé!
const MOCK_PERMISSIONS = [
  { label: 'Quản lý Nhân sự', value: 1 },
  { label: 'Quản lý Phòng', value: 2 },
  { label: 'Quản lý Đặt phòng (Booking)', value: 3 },
  { label: 'Quản lý Hóa đơn & Kế toán', value: 4 },
];

const RoleManagePage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // State quản lý việc Đóng/Mở cái ngăn kéo (Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // Lưu trữ chức danh đang được chọn
  const [checkedPermissions, setCheckedPermissions] = useState([]); // Lưu các ô checkbox được tick
  const [isSaving, setIsSaving] = useState(false);

  // ✅ THÊM HOOK NOTIFICATION
  const { addNotification } = useNotification();

  // Gọi API lấy dữ liệu bảng
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleApi.getAllRoles();
      console.log('Response từ API:', response);
      
      // ✅ FIX: API trả về { total, data: [...] } nên cần lấy response.data.data
      const rolesData = response.data?.data || response.data || [];
      
      // Kiểm tra xem có phải array không
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        console.warn('⚠️ Response không phải array:', rolesData);
        setRoles([]);
        message.warning('Dữ liệu vai trò không hợp lệ!');
      }
    } catch (error) {
      console.error('❌ Lỗi gọi API:', error);
      message.error('Không thể tải danh sách Vai trò!');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Hàm chạy khi bấm nút "Phân quyền" màu xanh
  const handleOpenDrawer = (role) => {
    setSelectedRole(role);
    setCheckedPermissions([]); // Mở ra thì xóa trắng các ô đã tick cũ
    setIsDrawerOpen(true);
  };

  // Hàm chạy khi bấm nút "Lưu thay đổi" trong ngăn kéo
  const handleSavePermissions = async () => {
    if (checkedPermissions.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 quyền!');
      return;
    }

    setIsSaving(true);
    try {
      // Vì Backend của bạn API chỉ nhận 1 quyền mỗi lần gọi, nên mình sẽ dùng vòng lặp gọi API cho từng quyền được tick
      const promises = checkedPermissions.map(permissionId => 
        roleApi.assignPermission({
          roleId: selectedRole.id,
          permissionId: permissionId
        })
      );

      // Chờ tất cả các API chạy xong cùng lúc
      await Promise.all(promises);
      message.success(`Đã cấp quyền thành công cho vai trò: ${selectedRole.name}`);
      
      // ✅ THÊM NOTIFICATION GỬI LÊN CHUÔNG
      addNotification(
        'Cấp quyền thành công',
        `Đã cấp ${checkedPermissions.length} quyền cho vai trò: ${selectedRole.name}`,
        'success'
      );

      setIsDrawerOpen(false); // Đóng ngăn kéo
      fetchRoles(); // Refresh dữ liệu

    } catch (error) {
      console.error('❌ Lỗi cấp quyền:', error);
      // Nếu Backend báo lỗi (ví dụ: Quyền này đã được cấp rồi) thì hiện thông báo
      if (error.response?.data?.Message) {
        message.error(error.response.data.Message);
        // ✅ GỬI THÔNG BÁO LỖI LÊN CHUÔNG
        addNotification(
          'Lỗi cấp quyền',
          error.response.data.Message,
          'error'
        );
      } else if (error.response?.data) {
        message.error(JSON.stringify(error.response.data));
        addNotification(
          'Lỗi cấp quyền',
          JSON.stringify(error.response.data),
          'error'
        );
      } else {
        message.error('Lỗi máy chủ!');
        addNotification(
          'Lỗi cấp quyền',
          'Lỗi máy chủ!',
          'error'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: '10%' },
    { 
      title: 'Tên Vai trò', dataIndex: 'name', key: 'name', width: '30%',
      render: (text) => <Text strong>{text}</Text>,
    },
    { 
      title: 'Mô tả', 
      dataIndex: 'description', 
      key: 'description', 
      width: '40%',
      render: (text) => <Text>{text || <span style={{color: '#ccc'}}>Chưa có mô tả</span>}</Text>,
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<SafetyCertificateOutlined />}
          disabled={record.name === 'Guest' || record.name === 'Admin'} 
          onClick={() => handleOpenDrawer(record)} // Gắn hàm mở ngăn kéo vào nút
        >
          Phân quyền
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={3} style={{ color: '#1890ff' }}>Quản lý Vai trò & Quyền (RBAC)</Title>
        <Text type="secondary">Lưu ý: Khi bạn thay đổi quyền của một Vai trò, tất cả nhân sự đang giữ Vai trò đó sẽ tự động được cập nhật.</Text>
      </div>

      <Table dataSource={roles} columns={columns} rowKey="id" pagination={false} loading={loading} bordered />

      {/* COMPONENT NGĂN KÉO (DRAWER) NẰM ẨN Ở ĐÂY */}
      <Drawer
        title={`Cấp quyền cho chức danh: ${selectedRole?.name}`}
        placement="right"
        size="default" 
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePermissions} loading={isSaving}>
            Lưu thay đổi
          </Button>
        }
      >
        <Text type="secondary">Chọn các module mà chức danh này được phép truy cập:</Text>
        <Divider />
        
        {/* Nhóm các ô Checkbox */}
        <Checkbox.Group 
          style={{ width: '100%' }} 
          value={checkedPermissions}
          onChange={(checkedValues) => setCheckedPermissions(checkedValues)}
        >
          <Space direction="vertical" size="middle">
            {MOCK_PERMISSIONS.map(item => (
              <Checkbox key={item.value} value={item.value}>
                <Text strong>{item.label}</Text>
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Drawer>
    </div>
  );
};

export default RoleManagePage;