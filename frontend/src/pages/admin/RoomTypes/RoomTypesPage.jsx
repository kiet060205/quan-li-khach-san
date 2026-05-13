import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Space, Modal, message, Input, Card, Popconfirm } from 'antd';
import { PictureOutlined, DeleteOutlined, StarFilled, StarOutlined, PlusOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi';
import { API_BASE } from '../../../api/axiosClient';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      const res = await roomApi.getRoomTypes();
      let types = [];
      if (res.data?.data) {
        types = res.data.data;
      } else if (Array.isArray(res.data)) {
        types = res.data;
      }
      setRoomTypes(types);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải dữ liệu hạng phòng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const openImageModal = (record) => {
    setSelectedRoomType(record);
    setIsImageModalVisible(true);
    setNewImageUrl('');
  };

  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) {
      message.warning('Vui lòng nhập link ảnh!');
      return;
    }
    setImageLoading(true);
    try {
      await roomApi.addRoomTypeImageUrl(selectedRoomType.id, newImageUrl);
      message.success('Thêm ảnh thành công!');
      setNewImageUrl('');
      // Làm mới dữ liệu
      const res = await roomApi.getRoomTypes();
      let types = res.data?.data || res.data || [];
      setRoomTypes(types);
      const updatedRoomType = types.find(t => t.id === selectedRoomType.id);
      setSelectedRoomType(updatedRoomType);
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.Message || 'Lỗi khi thêm ảnh!');
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await roomApi.deleteRoomTypeImage(imageId);
      message.success('Đã xóa ảnh!');
      // Làm mới dữ liệu
      const res = await roomApi.getRoomTypes();
      let types = res.data?.data || res.data || [];
      setRoomTypes(types);
      const updatedRoomType = types.find(t => t.id === selectedRoomType.id);
      setSelectedRoomType(updatedRoomType);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xóa ảnh!');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await roomApi.setPrimaryImage(selectedRoomType.id, imageId);
      message.success('Đã đặt làm ảnh đại diện!');
      // Làm mới dữ liệu
      const res = await roomApi.getRoomTypes();
      let types = res.data?.data || res.data || [];
      setRoomTypes(types);
      const updatedRoomType = types.find(t => t.id === selectedRoomType.id);
      setSelectedRoomType(updatedRoomType);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi cập nhật ảnh đại diện!');
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const columns = [
    { title: 'Tên Hạng Phòng', dataIndex: 'name', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Sức chứa', key: 'capacity', render: (_, r) => `${r.capacityAdults} người lớn, ${r.capacityChildren} trẻ em` },
    { title: 'Giá cơ bản', dataIndex: 'basePrice', key: 'basePrice', render: val => `${parseInt(val).toLocaleString('vi-VN')} VNĐ` },
    {
      title: 'Số lượng ảnh',
      key: 'imageCount',
      render: (_, r) => {
        const count = r.roomImages?.length || 0;
        return <span>{count} ảnh</span>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<PictureOutlined />} 
          onClick={() => openImageModal(record)}
        >
          Quản lý Hình Ảnh
        </Button>
      )
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#f7f9fa', minHeight: '100vh' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          borderRadius: '16px', padding: '32px 40px', marginBottom: '28px',
          color: 'white', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
              Quản lý Hạng Phòng & Hình Ảnh
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              Quản lý các hạng phòng và cấu hình link ảnh Cloudinary để hiển thị trên website.
            </Text>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <Table 
            loading={loading}
            columns={columns}
            dataSource={roomTypes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>

        {/* Modal Quản lý Ảnh */}
        <Modal
          title={`Hình ảnh hạng phòng: ${selectedRoomType?.name}`}
          open={isImageModalVisible}
          onCancel={() => setIsImageModalVisible(false)}
          footer={null}
          width={800}
        >
          <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
            <Input 
              placeholder="Dán link ảnh Cloudinary vào đây (Bắt đầu bằng http...)" 
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              onPressEnter={handleAddImageUrl}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddImageUrl} loading={imageLoading}>
              Thêm Ảnh
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {selectedRoomType?.roomImages?.map(img => (
              <Card 
                key={img.id} 
                hoverable 
                cover={<img alt="room" src={getFullImageUrl(img.imageUrl)} style={{ height: 140, objectFit: 'cover' }} />}
                bodyStyle={{ padding: 12 }}
                actions={[
                  <Button 
                    type="text" 
                    icon={img.isPrimary ? <StarFilled style={{color: '#faad14'}}/> : <StarOutlined />} 
                    onClick={() => handleSetPrimary(img.id)}
                    title="Đặt làm ảnh đại diện"
                  />,
                  <Popconfirm title="Xóa ảnh này?" onConfirm={() => handleDeleteImage(img.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} title="Xóa ảnh" />
                  </Popconfirm>
                ]}
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }} title={img.imageUrl}>
                  {img.imageUrl}
                </div>
              </Card>
            ))}
            
            {(!selectedRoomType?.roomImages || selectedRoomType.roomImages.length === 0) && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                Chưa có hình ảnh nào. Hãy dán link và thêm ảnh mới!
              </div>
            )}
          </div>
        </Modal>
      </Content>
    </Layout>
  );
}
