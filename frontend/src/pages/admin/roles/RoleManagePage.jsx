import React, { useState, useEffect } from 'react';
import { Button, Typography, message, Switch, Badge, Layout, Menu, Row, Col, List, Divider, Space, Card, Spin, Input } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SearchOutlined, SaveOutlined } from '@ant-design/icons';
import { roleApi } from '../../../api/roleApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const MOCK_MODULES = [
  {
    id: 'dashboard', name: 'Dashboard', permissions: [
      { id: 1, name: 'Xem tổng quan', description: 'Cho phép xem thống kê tổng quan' }
    ]
  },
  {
    id: 'employee', name: 'Nhân viên', permissions: [
      { id: 2, name: 'Xem nhân viên', description: 'Cho phép xem danh sách nhân viên' },
      { id: 3, name: 'Tạo nhân viên', description: 'Cho phép thêm nhân viên mới' },
      { id: 4, name: 'Sửa nhân viên', description: 'Cho phép chỉnh sửa thông tin' },
      { id: 5, name: 'Phân quyền', description: 'Cho phép phân quyền nhân viên' },
    ]
  },
  {
    id: 'room_tracking', name: 'Theo dõi phòng', permissions: [
      { id: 6, name: 'Xem trạng thái', description: 'Cho phép xem trạng thái phòng hôm nay' },
      { id: 7, name: 'Cập nhật dọn dẹp', description: 'Cho phép đánh dấu phòng sạch/dơ' },
    ]
  },
  {
    id: 'room', name: 'Quản lý phòng', permissions: [
      { id: 8, name: 'Xem phòng', description: 'Cho phép xem danh sách phòng và chi tiết phòng.' },
      { id: 9, name: 'Sửa phòng', description: 'Cho phép cập nhật thông tin phòng.' },
      { id: 10, name: 'Tạo phòng', description: 'Cho phép thêm phòng mới.' },
      { id: 11, name: 'Vật tư phòng', description: 'Cho phép xem và quản lý vật tư theo từng phòng.' },
    ]
  },
  {
    id: 'housekeeping', name: 'Nhiệm vụ dọn phòng', permissions: [
      { id: 12, name: 'Xem nhiệm vụ', description: 'Cho phép xem danh sách nhiệm vụ' },
      { id: 13, name: 'Giao nhiệm vụ', description: 'Cho phép giao việc cho nhân viên' },
    ]
  },
  {
    id: 'equipment', name: 'Vật tư', permissions: [
      { id: 14, name: 'Quản lý kho', description: 'Cho phép xem số lượng vật tư kho' },
    ]
  },
  {
    id: 'loss', name: 'Thất thoát đền bù', permissions: [
      { id: 15, name: 'Xem thất thoát đền bù', description: 'Cho phép xem các phiếu thất thoát đền bù.' },
      { id: 16, name: 'Sửa thất thoát đền bù', description: 'Cho phép chỉnh sửa phiếu thất thoát đền bù.' },
      { id: 17, name: 'Tạo thất thoát đền bù', description: 'Cho phép tạo phiếu thất thoát đền bù.' },
      { id: 18, name: 'Xử lý thất thoát đền bù', description: 'Cho phép xử lý và hoàn tất phiếu thất thoát đền bù.' },
    ]
  },
  {
    id: 'booking', name: 'Booking', permissions: [
      { id: 19, name: 'Xem booking', description: 'Cho phép xem danh sách booking' },
      { id: 20, name: 'Tạo booking', description: 'Cho phép tạo booking mới' },
      { id: 21, name: 'Hủy booking', description: 'Cho phép hủy booking' },
      { id: 22, name: 'Xác nhận đến', description: 'Cho phép check-in' },
    ]
  },
];

const MOCK_ROLES = [
  { id: 1, name: 'Admin', description: 'Quản trị' },
  { id: 2, name: 'HouseKeeping', description: 'Dọn phòng' },
  { id: 3, name: 'Receptionist', description: 'Lễ tân' },
];

const RoleManagePage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedModule, setSelectedModule] = useState(MOCK_MODULES[6]); // Default to 'Thất thoát đền bù'
  const [rolePermissions, setRolePermissions] = useState({
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    2: [6, 7, 12],
    3: [1, 6, 8, 15, 17, 19, 20, 21, 22]
  });
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleApi.getAllRoles();
      const raw = response.data;
      // API trả về { value: [...], Count: N }
      const rolesData = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      const list = Array.isArray(rolesData) && rolesData.length > 0 ? rolesData : MOCK_ROLES;
      setRoles(list);
      if (list.length > 0) setSelectedRole(list[0]);
    } catch {
      setRoles(MOCK_ROLES);
      setSelectedRole(MOCK_ROLES[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (permId, checked) => {
    if (!selectedRole) return;
    setRolePermissions(prev => {
      const currentRolePerms = prev[selectedRole.id] || [];
      let newPerms;
      if (checked) {
        newPerms = [...currentRolePerms, permId];
      } else {
        newPerms = currentRolePerms.filter(id => id !== permId);
      }
      return { ...prev, [selectedRole.id]: newPerms };
    });
  };

  const handleToggleAllModule = (checked) => {
    if (!selectedRole || !selectedModule) return;
    const modulePermIds = selectedModule.permissions.map(p => p.id);
    
    setRolePermissions(prev => {
      const currentRolePerms = prev[selectedRole.id] || [];
      let newPerms;
      if (checked) {
        // Add all module perms that are not already present
        const toAdd = modulePermIds.filter(id => !currentRolePerms.includes(id));
        newPerms = [...currentRolePerms, ...toAdd];
      } else {
        // Remove all module perms
        newPerms = currentRolePerms.filter(id => !modulePermIds.includes(id));
      }
      return { ...prev, [selectedRole.id]: newPerms };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, send rolePermissions[selectedRole.id] to API
      message.success(`Đã lưu thay đổi vai trò ${selectedRole.name}`);
      addNotification('Thành công', 'Đã lưu cấu hình phân quyền', 'success');
    } catch (error) {
      message.error('Lỗi lưu quyền');
    } finally {
      setIsSaving(false);
    }
  };

  const getModulePermCount = (roleId, mod) => {
    const rolePerms = rolePermissions[roleId] || [];
    return mod.permissions.filter(p => rolePerms.includes(p.id)).length;
  };

  const isModuleAllChecked = () => {
    if (!selectedRole || !selectedModule) return false;
    const rolePerms = rolePermissions[selectedRole.id] || [];
    return selectedModule.permissions.every(p => rolePerms.includes(p.id)) && selectedModule.permissions.length > 0;
  };

  if (loading) return <div style={{textAlign: 'center', padding: 50}}><Spin size="large" /></div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* Header bar */}
      <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button style={{ borderRadius: 8, fontWeight: 600 }}>Bật tất cả</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isSaving} style={{ borderRadius: 8, fontWeight: 600 }}>Lưu thay đổi</Button>
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 24, overflow: 'hidden' }}>
        
        {/* Left Column: Roles */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 20 }}>
             <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8, display: 'block' }}>QUẢN LÝ NHÓM</Text>
             <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Chỉnh sửa vai trò</Title>
             <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>Trang sửa riêng cho từng vai trò và phân quyền theo từng tab bên.</Text>
          </div>
          
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ textAlign: 'left', padding: '0 8px', marginBottom: 16, width: 'fit-content', color: '#1677ff', background: '#e6f4ff', fontWeight: 600 }}>
            Trở về
          </Button>

          <Button type="dashed" icon={<PlusOutlined />} style={{ marginBottom: 16, borderRadius: 8, height: 40, borderColor: '#d9d9d9', color: '#595959' }} block>
            Tạo vai trò
          </Button>

          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {roles.map(role => (
              <div 
                key={role.id}
                onClick={() => setSelectedRole(role)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: selectedRole?.id === role.id ? '#1677ff' : 'transparent',
                  color: selectedRole?.id === role.id ? '#fff' : '#262626',
                  fontWeight: selectedRole?.id === role.id ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedRole?.id === role.id ? '#fff' : '#1677ff' }}></div>
                  {role.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Modules */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, display: 'block' }}>THANH BÊN</Text>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {MOCK_MODULES.map(mod => {
              const count = selectedRole ? getModulePermCount(selectedRole.id, mod) : 0;
              const isSelected = selectedModule?.id === mod.id;
              
              return (
                <div 
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isSelected ? '#e6f4ff' : 'transparent',
                    color: isSelected ? '#1677ff' : '#262626',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {mod.name}
                  <div style={{ 
                    background: count > 0 ? (isSelected ? '#1677ff' : '#e6f4ff') : '#f5f5f5', 
                    color: count > 0 ? (isSelected ? '#fff' : '#1677ff') : '#bfbfbf',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permissions Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, display: 'block' }}>MÔ TẢ</Text>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 12, padding: '32px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {selectedRole && selectedModule ? (
              <div style={{ maxWidth: 800 }}>
                {/* Module Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <Title level={3} style={{ margin: '0 0 8px 0' }}>{selectedModule.name}</Title>
                    <Text type="secondary">Nếu tắt quyền xem thì các quyền liên quan trong cùng nhóm cũng tắt theo.</Text>
                  </div>
                  <Input 
                    placeholder="Tìm quyền..." 
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                    style={{ width: 200, borderRadius: 8 }}
                  />
                </div>

                {/* Module Master Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fafafa', borderRadius: 12, marginBottom: 24, border: '1px solid #f0f0f0' }}>
                  <div>
                    <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{selectedModule.name}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{getModulePermCount(selectedRole.id, selectedModule)} quyền đang bật</Text>
                  </div>
                  <Switch checked={isModuleAllChecked()} onChange={handleToggleAllModule} />
                </div>

                {/* Permissions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedModule.permissions.map(perm => {
                    const isChecked = (rolePermissions[selectedRole.id] || []).includes(perm.id);
                    return (
                      <div key={perm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 12, border: '1px solid #f0f0f0', background: isChecked ? '#fff' : '#fafafa', transition: 'all 0.2s' }}>
                        <div>
                          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4, color: isChecked ? '#262626' : '#8c8c8c' }}>{perm.name}</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>{perm.description}</Text>
                        </div>
                        <Switch checked={isChecked} onChange={(checked) => handleTogglePermission(perm.id, checked)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Chọn một nhóm quyền để xem chi tiết</Text>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoleManagePage;