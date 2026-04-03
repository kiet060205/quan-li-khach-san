import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Typography,
  message,
  Space,
  Input,
  Popconfirm,
  Form,
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { userApi } from '../../../api/userApi';
import { roleApi } from '../../../api/roleApi';
import UserForm from './UserForm';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  // ✅ Gọi hook Notification
  const { addNotification } = useNotification();

  // Lấy danh sách users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAllUsers();
      const usersData = response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('❌ Lỗi gọi API:', error);
      message.error('Không thể tải danh sách nhân sự!');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách roles
  const fetchRoles = async () => {
    try {
      const response = await roleApi.getAllRoles();
      const rolesData = response.data?.data || response.data || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('❌ Lỗi gọi API roles:', error);
      message.error('Không thể tải danh sách vị trí!');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Mở modal thêm user
  const handleOpenAddModal = () => {
    form.resetFields();
    setIsEditMode(false);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Mở modal sửa user
  const handleOpenEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  // Xử lý submit form (thêm/sửa)
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (isEditMode && selectedUser) {
        // Sửa user
        await userApi.updateUser(selectedUser.id, {
          ...selectedUser,
          ...values,
        });
        message.success('✅ Cập nhật thông tin nhân sự thành công!');
        // ✅ Gửi thông báo lên Global
        addNotification(
          'Cập nhật nhân sự',
          `Đã cập nhật thông tin: ${values.fullName}`,
          'success'
        );
      } else {
        // Thêm user mới
        await userApi.createUser(values);
        message.success('✅ Tạo tài khoản nhân sự thành công!');
        // ✅ Gửi thông báo lên Global
        addNotification(
          'Thêm nhân sự mới',
          `Đã tạo tài khoản: ${values.fullName}`,
          'success'
        );
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi:', error);
      if (error.response?.data?.Message) {
        message.error(error.response.data.Message);
      } else {
        message.error('Có lỗi xảy ra!');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Xóa user
  const handleDeleteUser = async (userId, userName) => {
    try {
      await userApi.deleteUser(userId);
      message.success('✅ Đã xóa nhân sự!');
      // ✅ Gửi thông báo lên Global
      addNotification('Xóa nhân sự', `Đã xóa nhân sự: ${userName}`, 'warning');
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi xóa:', error);
      message.error('Không thể xóa nhân sự!');
    }
  };

  // Thay đổi role của user
  const handleChangeRole = async (userId, newRoleId, userName) => {
    try {
      await userApi.changeUserRole(userId, newRoleId);
      message.success('✅ Cập nhật vị trí thành công!');
      const roleName = roles.find((r) => r.id === newRoleId)?.name || 'không xác định';
      // ✅ Gửi thông báo lên Global
      addNotification(
        'Thay đổi vị trí',
        `Đã thay đổi vị trí của ${userName} thành ${roleName}`,
        'info'
      );
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi thay đổi role:', error);
      message.error('Không thể thay đổi vị trí!');
    }
  };

  // Toggle Status (Bật/Tắt trạng thái)
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.status;
      await userApi.updateUser(user.id, {
        ...user,
        status: newStatus,
      });

      message.success(`✅ ${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} nhân sự thành công!`);
      // ✅ Gửi thông báo lên Global
      addNotification(
        newStatus ? 'Kích hoạt nhân sự' : 'Vô hiệu hóa nhân sự',
        `${user.fullName} đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
        newStatus ? 'success' : 'warning'
      );
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi thay đổi trạng thái:', error);
      message.error('Không thể thay đổi trạng thái!');
    }
  };

  // Bộ lọc search
  const filteredUsers = users.filter((user) =>
    user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.phone?.includes(searchText)
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '6%',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: '18%',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '22%',
      render: (email) => <a href={`mailto:${email}`}>{email}</a>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: '12%',
      render: (phone) => phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Vị trí',
      dataIndex: ['role', 'name'],
      key: 'roleName',
      width: '14%',
      render: (roleName, record) => (
        <Tooltip title="Click để thay đổi vị trí">
          <Select
            value={record.roleId}
            style={{ width: '100%' }}
            onClick={(e) => e.stopPropagation()}
            onChange={(newRoleId) => handleChangeRole(record.id, newRoleId, record.fullName)}
          >
            {roles.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status, record) => (
        <Tooltip title="Click để bật/tắt">
          <Button
            type={status ? 'primary' : 'default'}
            icon={status ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleStatus(record)}
            style={{
              backgroundColor: status ? '#52c41a' : '#d9d9d9',
              borderColor: status ? '#52c41a' : '#d9d9d9',
              color: status ? 'white' : '#000',
            }}
          >
            {status ? 'Hoạt động' : 'Vô hiệu'}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '16%',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenEditModal(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa nhân sự"
            description={`Bạn có chắc chắn muốn xóa nhân sự: ${record.fullName}?`}
            onConfirm={() => handleDeleteUser(record.id, record.fullName)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
            Danh sách Nhân sự & Người dùng
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModal}
              size="large"
            >
              Thêm nhân sự
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
              size="large"
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {/* Search Bar */}
        <Input.Search
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
          allowClear
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nhân sự`,
        }}
        scroll={{ x: 1200 }}
        bordered
      />

      {/* Modal thêm/sửa user */}
      <Modal
        title={isEditMode ? `Sửa thông tin: ${selectedUser?.fullName}` : 'Thêm nhân sự mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <UserForm
          form={form}
          onFinish={handleFormSubmit}
          loading={formLoading}
          roles={roles}
          isEditMode={isEditMode}
        />
      </Modal>
    </div>
  );
};

export default UserManagementPage;
