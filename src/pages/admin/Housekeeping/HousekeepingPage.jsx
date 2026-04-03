import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Badge, Button, Spin, message, Modal, Select, Space } from 'antd';
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; // Chỉnh lại đường dẫn nếu cần

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const HousekeepingPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Modal cập nhật
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Hàm kéo dữ liệu (Chỉ lấy những phòng cần dọn/kiểm tra)
  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Tạm thời gọi API lấy tất cả, sau này nếu DB lớn bro có thể viết API riêng chỉ lấy phòng dơ
      const response = await roomApi.getAllRooms();
      const data = response.data?.data || response.data || [];
      
      // Lọc ra những phòng có trạng thái KHÔNG PHẢI là Available (Ví dụ: Cleaning, Maintenance, Occupied...)
      // Bro có thể tự chỉnh lại logic lọc theo đúng quy trình khách sạn của bro
      const roomsNeedAttention = data.filter(r => r.status !== 'Available');
      
      setRooms(roomsNeedAttention);
    } catch (error) {
      console.error(error);
      message.error("Lỗi lấy danh sách phòng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Mở Pop-up khi bấm vào thẻ phòng
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setNewStatus(room.status); // Gán trạng thái hiện tại làm mặc định
    setIsModalVisible(true);
  };

  // Lưu trạng thái mới
  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      await roomApi.updateRoomStatus(selectedRoom.id, newStatus);
      message.success(`Đã cập nhật phòng ${selectedRoom.roomNumber} thành công!`);
      setIsModalVisible(false);
      fetchRooms(); // Tải lại danh sách
    } catch (error) {
      console.error(error);
      message.error("Lỗi cập nhật trạng thái!");
    } finally {
      setUpdating(false);
    }
  };

  // Hàm chọn màu chấm Badge theo trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'Cleaning': return 'orange';
      case 'Occupied': return 'red';
      case 'Maintenance': return 'default';
      default: return 'blue';
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        
        {/* Tiêu đề & Nút Làm mới (Giống hệt ảnh của bro) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Sơ đồ Buồng phòng (Housekeeping)</Title>
            <Text type="secondary">Nhấn vào phòng để bắt đầu công việc dọn dẹp và kiểm tra vật tư.</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchRooms} loading={loading}>
            Làm mới
          </Button>
        </div>

        {/* Lưới các phòng cần dọn */}
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            {rooms.length > 0 ? (
              rooms.map(room => (
                <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                  <Card 
                    hoverable 
                    onClick={() => handleRoomClick(room)}
                    style={{ 
                      borderRadius: '8px', 
                      borderTop: `4px solid ${getStatusColor(room.status)}` // Viền trên đổi màu theo trạng thái
                    }}
                    bodyStyle={{ padding: '16px', textAlign: 'center' }}
                  >
                    <Title level={2} style={{ margin: '0 0 8px 0' }}>{room.roomNumber}</Title>
                    <div style={{ marginBottom: '8px' }}>
                      <Badge color={getStatusColor(room.status)} text={<Text strong>{room.status}</Text>} />
                    </div>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      Tầng {room.floor} - {room.roomType?.name || 'Chưa phân hạng'}
                    </Text>
                  </Card>
                </Col>
              ))
            ) : (
              <Col span={24}>
                <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '8px' }}>
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={4}>Tuyệt vời!</Title>
                  <Text type="secondary">Hiện tại không có phòng nào cần dọn dẹp hoặc kiểm tra.</Text>
                </div>
              </Col>
            )}
          </Row>
        </Spin>

        {/* Modal Cập nhật Trạng thái */}
        <Modal
          title={`Cập nhật công việc: Phòng ${selectedRoom?.roomNumber}`}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <div style={{ padding: '16px 0' }}>
            <Text>Chọn trạng thái mới sau khi hoàn tất công việc:</Text>
            <Select 
              value={newStatus} 
              onChange={setNewStatus} 
              style={{ width: '100%', marginTop: '8px', marginBottom: '24px' }}
              size="large"
            >
              <Option value="Available">Phòng Sạch / Sẵn sàng đón khách (Available)</Option>
              <Option value="Cleaning">Đang dọn dẹp (Cleaning)</Option>
              <Option value="Maintenance">Cần sửa chữa / Bảo trì (Maintenance)</Option>
            </Select>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" loading={updating} onClick={handleSaveStatus}>
                Lưu xác nhận
              </Button>
            </Space>
          </div>
        </Modal>

      </Content>
    </Layout>
  );
};

export default HousekeepingPage;