import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Modal, Form, Input, message, Row, Col, InputNumber, Divider, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, CompassOutlined, SearchOutlined } from '@ant-design/icons';
import { attractionApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const MOCK_ATTRACTIONS = [
  { id: 1, name: 'Biển hồ', description: 'Biển hồ tự nhiên tuyệt đẹp, điểm check-in không thể bỏ lỡ.', distanceKm: 16, category: 'Biển', latitude: '14.03', longitude: '107.96', mapEmbedLink: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15582.479532688177!2d107.97340325!3d14.0191746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316c21e64627b031%3A0xc6e4dfdf04710186!2zQmnhu4NuIEjhu5M!5e0!3m2!1svi!2s!4v1714032000000!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' },
  { id: 2, name: 'Công viên', description: 'Khu vui chơi giải trí trung tâm', distanceKm: 2.5, category: 'Công viên', latitude: '14.00', longitude: '108.00', mapEmbedLink: '' },
];

const AttractionsPage = () => {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const res = await attractionApi.getAllAttractions();
      const data = Array.isArray(res.data) ? res.data : [];
      setAttractions(data.length > 0 ? data : MOCK_ATTRACTIONS);
      if (data.length > 0 && !selectedItem) setSelectedItem(data[0]);
      else if (MOCK_ATTRACTIONS.length > 0 && !selectedItem) setSelectedItem(MOCK_ATTRACTIONS[0]);
    } catch { 
      setAttractions(MOCK_ATTRACTIONS); 
      if (!selectedItem) setSelectedItem(MOCK_ATTRACTIONS[0]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttractions(); }, []);

  const filteredAttractions = attractions.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (record) => { setEditingAttraction(record); form.setFieldsValue({ ...record }); setIsModalVisible(true); };
  const handleDelete = (id) => {
    Modal.confirm({ title: 'Xóa địa điểm này?', okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await attractionApi.deleteAttraction(id); } catch {}
        setAttractions(prev => prev.filter(a => a.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
        message.success('Đã xóa!');
      }
    });
  };
  
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        latitude: values.latitude ? parseFloat(values.latitude) : null,
        longitude: values.longitude ? parseFloat(values.longitude) : null,
      };

      if (editingAttraction) {
        await attractionApi.updateAttraction(editingAttraction.id, { ...editingAttraction, ...payload }).catch(() => {});
        const updated = { ...editingAttraction, ...payload };
        setAttractions(prev => prev.map(a => a.id === editingAttraction.id ? updated : a));
        if (selectedItem?.id === editingAttraction.id) setSelectedItem(updated);
        addNotification('Cập nhật Địa Điểm', `Đã cập nhật: ${values.name}`, 'info');
      } else {
        const newItem = { id: Date.now(), ...payload };
        await attractionApi.createAttraction(payload).catch(() => {});
        setAttractions(prev => [newItem, ...prev]);
        setSelectedItem(newItem);
        addNotification('Địa Điểm Mới', `Đã thêm: ${values.name}`, 'success');
      }
      message.success(editingAttraction ? 'Cập nhật thành công!' : 'Thêm thành công!');
      setIsModalVisible(false);
    } catch { message.error('Lỗi lưu dữ liệu!'); }
  };

  const extractSrc = (html) => {
    if (!html) return '';
    if (html.includes('<iframe') && html.includes('src="')) {
      const m = html.match(/src="([^"]+)"/);
      return m ? m[1] : html;
    }
    return html;
  };

  return (
    <div style={{ padding: '0 0 24px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Row gutter={24} style={{ flex: 1, overflow: 'hidden' }}>
        {/* Left List */}
        <Col span={7} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Danh sách địa điểm</Title>
              <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => { setEditingAttraction(null); form.resetFields(); setIsModalVisible(true); }} />
            </div>
            
            <Input 
              placeholder="Tìm tên địa điểm, danh mục..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderRadius: 8, marginBottom: 16, padding: '8px 12px' }}
            />
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              {filteredAttractions.length === 0 ? <Empty description="Không tìm thấy" style={{marginTop: 40}} /> : null}
              {filteredAttractions.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: 12, 
                    marginBottom: 12,
                    cursor: 'pointer',
                    background: selectedItem?.id === item.id ? '#f0f5ff' : '#fff',
                    border: `1px solid ${selectedItem?.id === item.id ? '#91caff' : '#f0f0f0'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <Text strong style={{ fontSize: 15, color: selectedItem?.id === item.id ? '#1677ff' : '#262626', display: 'block', marginBottom: 4 }}>
                    {item.name}
                  </Text>
                  <Space split={<Divider type="vertical" />} style={{ fontSize: 13, color: '#8c8c8c' }}>
                    <span>{item.category || 'Địa điểm'}</span>
                    <span>Cách {item.distanceKm} km</span>
                  </Space>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Right Detail */}
        <Col span={17} style={{ height: '100%' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            {selectedItem ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 700 }}>{selectedItem.name}</Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>{selectedItem.description}</Text>
                  </div>
                  <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(selectedItem)}>Chỉnh sửa</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(selectedItem.id)} />
                  </Space>
                </div>

                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <div style={{ background: '#f5f5f5', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>LATITUDE</Text>
                      <Text strong style={{ fontSize: 20 }}>{selectedItem.latitude || '—'}</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: '#f5f5f5', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>LONGITUDE</Text>
                      <Text strong style={{ fontSize: 20 }}>{selectedItem.longitude || '—'}</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: '#e6f4ff', padding: '16px 20px', borderRadius: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', color: '#1677ff' }}>KHOẢNG CÁCH</Text>
                      <Text strong style={{ fontSize: 20, color: '#1677ff' }}>{selectedItem.distanceKm} km</Text>
                    </div>
                  </Col>
                </Row>

                <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fafafa' }}>
                  {selectedItem.mapEmbedLink ? (
                    <iframe 
                      src={extractSrc(selectedItem.mapEmbedLink)} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      title="Map" 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#bfbfbf' }}>
                      <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <Text type="secondary">Chưa có dữ liệu bản đồ cho địa điểm này</Text>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <CompassOutlined style={{ fontSize: 64, color: '#e6f4ff', marginBottom: 20 }} />
                <Title level={4} style={{ color: '#8c8c8c' }}>Chọn một địa điểm để xem chi tiết</Title>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Form Modal */}
      <Modal title={editingAttraction ? 'Cập nhật Địa Điểm' : 'Thêm Địa Điểm Mới'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} width={600} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên Địa Điểm" rules={[{ required: true }]}>
            <Input placeholder="VD: Biển hồ" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Danh Mục">
                <Input placeholder="VD: Biển, Núi, Nhà hàng..." />
              </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item name="distanceKm" label="Khoảng Cách (km)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="VD: 16" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô Tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về địa điểm..." />
          </Form.Item>
          <Row gutter={16}>
             <Col span={12}>
                <Form.Item name="latitude" label="Vĩ độ (Latitude)">
                  <Input placeholder="VD: 14.03" />
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item name="longitude" label="Kinh độ (Longitude)">
                  <Input placeholder="VD: 107.96" />
                </Form.Item>
             </Col>
          </Row>
          <Form.Item name="mapEmbedLink" label="Link Google Maps (src hoặc iframe)">
            <Input.TextArea rows={2} placeholder="Paste link src hoặc mã iframe từ Google Maps..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttractionsPage;
