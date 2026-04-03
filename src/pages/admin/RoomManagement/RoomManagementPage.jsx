import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Input, Select, Space, Tag, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
// Đã bổ sung thêm EyeOutlined vào đây:
import { PlusOutlined, FilterOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; 
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RoomManagementPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm(); // Hook form cho Modal Sửa
  
  // States dữ liệu
  const [allRooms, setAllRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [roomTypesList, setRoomTypesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // States lọc
  const [filterMinFloor, setFilterMinFloor] = useState('');
  const [filterMaxFloor, setFilterMaxFloor] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterRoomNumber, setFilterRoomNumber] = useState('');

  // States cho Modal Sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Hàm tải dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        roomApi.getAllRooms(),
        roomApi.getRoomTypes()
      ]);
      const rooms = roomsRes.data?.data || roomsRes.data || [];
      const types = typesRes.data?.data || typesRes.data || [];

      setAllRooms(rooms); 
      setRoomsData(rooms);
      setRoomTypesList(types);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
  }, []);

  // Hàm Lọc
  const handleFilter = () => {
    let result = [...allRooms];
    if (filterMinFloor) result = result.filter(r => r.floor >= parseInt(filterMinFloor));
    if (filterMaxFloor) result = result.filter(r => r.floor <= parseInt(filterMaxFloor));
    if (filterRoomType !== 'all') result = result.filter(r => r.roomType?.name === filterRoomType);
    if (filterRoomNumber) result = result.filter(r => r.roomNumber.toLowerCase().includes(filterRoomNumber.toLowerCase()));
    setRoomsData(result);
  };

  const clearFilter = () => {
    setFilterMinFloor(''); setFilterMaxFloor(''); setFilterRoomType('all'); setFilterRoomNumber('');
    setRoomsData(allRooms);
  };

  // Hàm Mở Modal Sửa Phòng
  const openEditModal = (record) => {
    setEditingRoomId(record.id); 
    form.setFieldsValue({
      id: record.id,
      roomNumber: record.roomNumber,
      floor: record.floor,
      roomTypeId: record.roomTypeId,
      status: record.status
    }); 
    setIsModalVisible(true);
  };

  // Hàm Lưu Dữ Liệu Sửa
  const handleUpdate = async (values) => {
    setSubmitLoading(true);
    try {
      await roomApi.updateRoom(editingRoomId, values);
      message.success('Cập nhật phòng thành công!');
      setIsModalVisible(false);
      fetchData(); 
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi cập nhật phòng!');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Hàm Xóa Phòng
  const handleDelete = async (id) => {
    try {
      await roomApi.deleteRoom(id);
      message.success('Đã xóa phòng!');
      fetchData(); 
    } catch (error) {
      console.error(error);
      message.error('Không thể xóa phòng này (Có thể đang dính dữ liệu Booking)!');
    }
  };

  // === CẤU HÌNH CỘT CHO BẢNG ===
  const columns = [
    { title: 'Số phòng', dataIndex: 'roomNumber', key: 'roomNumber' },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor' },
    {
      title: 'Hạng phòng',
      key: 'roomType',
      render: (_, record) => record.roomType ? record.roomType.name : 'Chưa có Hạng',
    },
    {
      title: 'Giá phòng',
      key: 'pricePerNight',
      render: (_, record) => record.roomType?.basePrice ? `${record.roomType.basePrice.toLocaleString()} VNĐ` : 'Chưa có giá',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        if (status === 'Available') color = 'green';
        else if (status === 'Cleaning') color = 'orange';
        else if (status === 'Occupied') color = 'red';
        else if (status === 'Maintenance') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Quản lý', // Cột chứa Sửa / Xóa
      key: 'manage',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          
          <Popconfirm
            title="Xóa phòng này?"
            description="Bạn có chắc chắn muốn xóa phòng này vĩnh viễn không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa luôn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: 'Thao tác', // Cột chứa nút Chi tiết đứng cuối cùng
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" icon={<EyeOutlined />}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#fff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4}>Quản lý phòng</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/rooms/create')}>
            Thêm phòng mới
          </Button>
        </div>

        {/* Thanh công cụ lọc */}
        <div style={{ background: '#f5f5f5', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
          <Space wrap>
            <Text strong>Lọc dữ liệu:</Text>
            <Input placeholder="Từ tầng..." value={filterMinFloor} onChange={(e) => setFilterMinFloor(e.target.value)} style={{ width: 100 }} />
            <Input placeholder="Đến tầng..." value={filterMaxFloor} onChange={(e) => setFilterMaxFloor(e.target.value)} style={{ width: 100 }} />
            <Select value={filterRoomType} onChange={(value) => setFilterRoomType(value)} style={{ width: 220 }}>
              <Option value="all">-- Tất cả hạng phòng --</Option>
              {roomTypesList.map(type => <Option key={type.id} value={type.name}>{type.name}</Option>)}
            </Select>
            <Input placeholder="Nhập số phòng..." value={filterRoomNumber} onChange={(e) => setFilterRoomNumber(e.target.value)} style={{ width: 150 }} />
            <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>Lọc kết quả</Button>
            <Button icon={<ReloadOutlined />} onClick={clearFilter}>Bỏ lọc</Button>
          </Space>
        </div>

        {/* Bảng dữ liệu */}
        <Table loading={loading} columns={columns} dataSource={roomsData} rowKey="id" bordered pagination={{ pageSize: 15 }} size="small" />

        {/* MODAL CẬP NHẬT PHÒNG */}
        <Modal
          title="Cập nhật thông tin phòng"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null} 
          destroyOnHidden // Đã fix cảnh báo màu hồng ở đây
        >
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <Form.Item name="id" hidden><Input /></Form.Item> 

            <Form.Item label="Số phòng" name="roomNumber" rules={[{ required: true, message: 'Nhập số phòng!' }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Tầng" name="floor" rules={[{ required: true, message: 'Nhập tầng!' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Hạng phòng" name="roomTypeId" rules={[{ required: true, message: 'Chọn hạng phòng!' }]}>
              <Select>
                {roomTypesList.map(type => (
                  <Option key={type.id} value={type.id}>{type.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select>
                <Option value="Available">Phòng trống (Available)</Option>
                <Option value="Occupied">Có khách (Occupied)</Option>
                <Option value="Cleaning">Đang dọn (Cleaning)</Option>
                <Option value="Maintenance">Bảo trì (Maintenance)</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submitLoading}>Lưu thay đổi</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

      </Content>
    </Layout>
  );
};

export default RoomManagementPage;