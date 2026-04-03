import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Input, Select, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; 
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RoomManagementPage = () => {
  const navigate = useNavigate();
  
  // === KHU VỰC 1: KHAI BÁO STATE ===
  // 1. Kho chứa dữ liệu
  const [allRooms, setAllRooms] = useState([]);     // Kho gốc (không bao giờ bị ghi đè)
  const [roomsData, setRoomsData] = useState([]);   // Kho hiển thị lên bảng
  const [loading, setLoading] = useState(false);

  // 2. State cho các ô Lọc
  const [filterMinFloor, setFilterMinFloor] = useState('');
  const [filterMaxFloor, setFilterMaxFloor] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterRoomNumber, setFilterRoomNumber] = useState('');
  
  // 3. State cho danh sách hạng phòng (để đổ vào Dropdown lọc)
  const [roomTypesList, setRoomTypesList] = useState([]);


  // === KHU VỰC 2: HÀM GỌI API ===
  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API: Lấy danh sách phòng & Lấy danh sách hạng phòng
      const [roomsRes, typesRes] = await Promise.all([
        roomApi.getAllRooms(),
        roomApi.getRoomTypes()
      ]);

      const rooms = roomsRes.data?.data || roomsRes.data || [];
      const types = typesRes.data?.data || typesRes.data || [];

      // Cất dữ liệu phòng vào cả 2 kho
      setAllRooms(rooms); 
      setRoomsData(rooms);
      
      // Cất danh sách hạng phòng để hiển thị trong Dropdown
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

  // === KHU VỰC 3: HÀM XỬ LÝ LỌC DỮ LIỆU ===
  const handleFilter = () => {
    let result = [...allRooms]; // Lấy danh sách gốc ra để xào nấu

    // 1. Lọc theo khoảng tầng
    if (filterMinFloor) {
      result = result.filter(room => room.floor >= parseInt(filterMinFloor));
    }
    if (filterMaxFloor) {
      result = result.filter(room => room.floor <= parseInt(filterMaxFloor));
    }

    // 2. Lọc theo hạng phòng
    if (filterRoomType !== 'all') {
      result = result.filter(room => room.roomType?.name === filterRoomType);
    }

    // 3. Lọc theo số phòng (Tìm kiếm gần đúng)
    if (filterRoomNumber) {
      result = result.filter(room => 
        room.roomNumber.toLowerCase().includes(filterRoomNumber.toLowerCase())
      );
    }

    // Đẩy kết quả đã lọc lên bảng
    setRoomsData(result);
  };

  // Hàm xóa bộ lọc, trả về ban đầu
  const clearFilter = () => {
    setFilterMinFloor('');
    setFilterMaxFloor('');
    setFilterRoomType('all');
    setFilterRoomNumber('');
    setRoomsData(allRooms); // Phục hồi dữ liệu gốc
  };


  // === KHU VỰC 4: CẤU HÌNH CỘT CHO BẢNG ===
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
      // ĐÃ FIX LỖI TÊN BIẾN Ở ĐÂY CHO BRO:
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
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" icon={<EyeOutlined />}>Chi tiết</Button>
        </Space>
      ),
    },
  ];

  // === KHU VỰC 5: RENDER GIAO DIỆN ===
  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#fff' }}>
        
        {/* Phần tiêu đề */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4}>Quản lý phòng</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/rooms/create')}
          >
            Thêm phòng mới
          </Button>
        </div>

        {/* Thanh công cụ lọc */}
        <div style={{ background: '#f5f5f5', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
          <Space wrap>
            <Text strong>Lọc dữ liệu:</Text>
            
            <Input 
              placeholder="Từ tầng..." 
              value={filterMinFloor}
              onChange={(e) => setFilterMinFloor(e.target.value)}
              style={{ width: 100 }} 
            />
            <Input 
              placeholder="Đến tầng..." 
              value={filterMaxFloor}
              onChange={(e) => setFilterMaxFloor(e.target.value)}
              style={{ width: 100 }} 
            />
            
            <Select 
              value={filterRoomType}
              onChange={(value) => setFilterRoomType(value)}
              style={{ width: 220 }}
            >
              <Option value="all">-- Tất cả hạng phòng --</Option>
              {/* TỰ ĐỘNG ĐỔ DANH SÁCH HẠNG PHÒNG TỪ API VÀO ĐÂY */}
              {roomTypesList.map(type => (
                <Option key={type.id} value={type.name}>{type.name}</Option>
              ))}
            </Select>

            <Input 
              placeholder="Nhập số phòng..." 
              value={filterRoomNumber}
              onChange={(e) => setFilterRoomNumber(e.target.value)}
              style={{ width: 150 }} 
            />

            <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
              Lọc kết quả
            </Button>
            <Button icon={<ReloadOutlined />} onClick={clearFilter}>
              Bỏ lọc
            </Button>
          </Space>
        </div>

        {/* Bảng dữ liệu */}
        <Table
          loading={loading}
          columns={columns}
          dataSource={roomsData}
          rowKey="id"
          bordered
          pagination={{ pageSize: 15 }}
          size="small"
        />
      </Content>
    </Layout>
  );
};

export default RoomManagementPage;