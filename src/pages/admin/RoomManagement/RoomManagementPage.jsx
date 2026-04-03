import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Input, Select, Space, Tag, message, Modal, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; 
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RoomManagementPage = () => {
  const navigate = useNavigate();
  
  // === KHU VỰC 1: KHAI BÁO STATE ===
  const [allRooms, setAllRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterMinFloor, setFilterMinFloor] = useState('');
  const [filterMaxFloor, setFilterMaxFloor] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterRoomNumber, setFilterRoomNumber] = useState('');
  
  const [roomTypesList, setRoomTypesList] = useState([]);

  // State cho Modal chi tiết
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [roomInventories, setRoomInventories] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // === KHU VỰC 2: HÀM GỌI API ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        roomApi.getAllRooms(),
        roomApi.getRoomTypes()
      ]);

      // Xử lý dữ liệu phòng
      let rooms = [];
      if (roomsRes.data?.data) {
        rooms = roomsRes.data.data;
      } else if (Array.isArray(roomsRes.data)) {
        rooms = roomsRes.data;
      } else if (roomsRes.data?.rooms) {
        rooms = roomsRes.data.rooms;
      }

      // Xử lý dữ liệu hạng phòng
      let types = [];
      if (typesRes.data?.data) {
        types = typesRes.data.data;
      } else if (Array.isArray(typesRes.data)) {
        types = typesRes.data;
      }

      setAllRooms(rooms); 
      setRoomsData(rooms);
      setRoomTypesList(types);

      if (rooms.length === 0) {
        message.warning('Không có dữ liệu phòng!');
      }

    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      message.error('Lỗi khi tải dữ liệu phòng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
  }, []);

  // === KHU VỰC 3: HÀM XỬ LÝ LỌC DỮ LIỆU ===
  const handleFilter = () => {
    let result = [...allRooms];

    if (filterMinFloor) {
      result = result.filter(room => room.floor >= parseInt(filterMinFloor));
    }
    if (filterMaxFloor) {
      result = result.filter(room => room.floor <= parseInt(filterMaxFloor));
    }

    if (filterRoomType !== 'all') {
      result = result.filter(room => room.roomType?.name === filterRoomType);
    }

    if (filterRoomNumber) {
      result = result.filter(room => 
        room.roomNumber.toLowerCase().includes(filterRoomNumber.toLowerCase())
      );
    }

    setRoomsData(result);
  };

  const clearFilter = () => {
    setFilterMinFloor('');
    setFilterMaxFloor('');
    setFilterRoomType('all');
    setFilterRoomNumber('');
    setRoomsData(allRooms);
  };

  // === KHU VỰC 3.5: HÀM XỬ LÝ MODAL CHI TIẾT ===
  const openDetailModal = async (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
    
    // Gọi API lấy danh sách vật tư
    setInventoryLoading(true);
    try {
      const response = await roomApi.getRoomInventory(room.id);
      
      // Xử lý dữ liệu response
      let data = [];
      if (response.data?.data) {
        data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      setRoomInventories(data);
      
      // Nếu không có dữ liệu, hiện message
      if (data.length === 0) {
        message.info('Phòng này chưa có vật tư nào!');
      }
    } catch (error) {
      console.error("Lỗi lấy vật tư:", error);
      // Nếu 404 hoặc không có dữ liệu, set array rỗng
      if (error.response?.status === 404) {
        setRoomInventories([]);
        message.info('Phòng này chưa có vật tư!');
      } else {
        message.error('Lỗi khi tải danh sách vật tư!');
      }
    } finally {
      setInventoryLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRoom(null);
    setRoomInventories([]);
  };

  // === KHU VỰC 3.6: HÀM CLONE VÀ SYNC ===
  const handleCloneFromTemplate = async (targetRoomId) => {
  // Tìm phòng mẫu dựa vào RoomType
  const templateRoom = allRooms.find(r => 
    r.roomType?.id === selectedRoom.roomType?.id && 
    r.id !== selectedRoom.id
  );
  
  if (!templateRoom) {
    message.warning('Không tìm thấy phòng mẫu khác cho hạng phòng này! Hãy dùng "Đồng bộ từ kho" thay vào.');
    return;
  }

  Modal.confirm({
    title: 'Clone từ phòng mẫu',
    content: `Bạn muốn clone vật tư từ phòng ${templateRoom.room_number} sang phòng ${selectedRoom.room_number}?`,
    okText: 'Đồng ý',
    cancelText: 'Hủy',
    onOk: async () => {
      setInventoryLoading(true);
      try {
        const response = await roomApi.cloneInventory({
          sourceRoomId: templateRoom.id,
          targetRoomId: targetRoomId
        });
        
        message.success(response.data?.message || 'Clone thành công!');
        
        // Reload lại danh sách vật tư
        const newInventory = await roomApi.getRoomInventory(targetRoomId);
        let data = [];
        if (newInventory.data?.data) {
          data = Array.isArray(newInventory.data.data) ? newInventory.data.data : [newInventory.data.data];
        }
        setRoomInventories(data);
      } catch (error) {
        console.error('Lỗi clone:', error);
        message.error(error.response?.data?.message || 'Lỗi khi clone vật tư!');
      } finally {
        setInventoryLoading(false);
      }
    }
  });
};

  const handleSyncFromWarehouse = async (roomId) => {
    Modal.confirm({
      title: 'Đồng bộ từ kho',
      content: `Bạn muốn đồng bộ tất cả vật tư từ kho cho phòng ${selectedRoom.roomNumber}?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        setInventoryLoading(true);
        try {
          const response = await roomApi.syncFromWarehouse({
            roomId: roomId
          });
          
          message.success(response.data?.message || 'Đồng bộ thành công!');
          
          // Reload lại danh sách vật tư
          const newInventory = await roomApi.getRoomInventory(roomId);
          let data = [];
          if (newInventory.data?.data) {
            data = Array.isArray(newInventory.data.data) ? newInventory.data.data : [newInventory.data.data];
          }
          setRoomInventories(data);
        } catch (error) {
          console.error('Lỗi sync:', error);
          message.error(error.response?.data?.message || 'Lỗi khi đồng bộ vật tư!');
        } finally {
          setInventoryLoading(false);
        }
      }
    });
  };

  // === KHU VỰC 4: CẤU HÌNH CỘT CHO BẢNG ===
  const columns = [
    { title: 'Số phòng', dataIndex: 'roomNumber', key: 'roomNumber' },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor' },
    {
      title: 'Hạng phòng',
      key: 'roomType',
      render: (_, record) => {
        if (record.roomType) {
          return record.roomType.name || 'Không xác định';
        }
        return 'Chưa gán Hạng';
      },
    },
    {
      title: 'Giá phòng',
      key: 'pricePerNight',
      render: (_, record) => {
        if (record.roomType && record.roomType.basePrice) {
          return `${parseInt(record.roomType.basePrice).toLocaleString('vi-VN')} VNĐ`;
        }
        return 'Chưa có giá';
      },
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
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // === KHU VỰC 5: RENDER GIAO DIỆN ===
  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#fff' }}>
        
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

        <Table
          loading={loading}
          columns={columns}
          dataSource={roomsData}
          rowKey="id"
          bordered
          pagination={{ pageSize: 15 }}
          size="small"
        />

        {/* === MODAL CHI TIẾT PHÒNG === */}
        {selectedRoom && (
          <Modal
            title={`Chi tiết phòng: ${selectedRoom.roomNumber}`}
            open={isDetailModalOpen}
            onCancel={closeDetailModal}
            footer={[
              <Button key="close" type="primary" onClick={closeDetailModal}>
                Đóng
              </Button>
            ]}
            width={800}
          >
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Số phòng" span={1}>
                {selectedRoom.roomNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Tầng" span={1}>
                {selectedRoom.floor}
              </Descriptions.Item>

              <Descriptions.Item label="Hạng phòng" span={1}>
                {selectedRoom.roomType?.name || 'Chưa gán'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng" span={1}>
                {selectedRoom.roomType?.basePrice 
                  ? `${parseInt(selectedRoom.roomType.basePrice).toLocaleString('vi-VN')} VNĐ` 
                  : 'Chưa có'}
              </Descriptions.Item>

              <Descriptions.Item label="Sức chứa người lớn" span={1}>
                {selectedRoom.roomType?.capacityAdults || 0} người
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa trẻ em" span={1}>
                {selectedRoom.roomType?.capacityChildren || 0} trẻ
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={2}>
                {selectedRoom.status === 'Available' && <Tag color="green">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Occupied' && <Tag color="red">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Cleaning' && <Tag color="orange">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Maintenance' && <Tag color="default">{selectedRoom.status}</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <Button 
                type="dashed" 
                onClick={() => handleCloneFromTemplate(selectedRoom.id)}
                loading={inventoryLoading}
              >
                📋 Clone từ phòng mẫu
              </Button>
              <Button 
                type="dashed" 
                onClick={() => handleSyncFromWarehouse(selectedRoom.id)}
                loading={inventoryLoading}
              >
                🏪 Đồng bộ từ kho
              </Button>
            </div>

            <div>
              <Title level={5}>Danh sách vật tư trong phòng</Title>
              <Table
                columns={[
                  { title: 'Tên vật tư', dataIndex: 'itemName', key: 'itemName' },
                  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                  { 
                    title: 'Giá đền bù', 
                    dataIndex: 'priceIfLost', 
                    key: 'priceIfLost',
                    render: (price) => price ? `${parseInt(price).toLocaleString('vi-VN')} VNĐ` : 'Chưa có'
                  }
                ]}
                dataSource={roomInventories}
                rowKey="id"
                loading={inventoryLoading}
                pagination={false}
                size="small"
              />
            </div>
          </Modal>
        )}
      </Content>
    </Layout>
  );
};

export default RoomManagementPage;