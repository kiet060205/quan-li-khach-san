import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Modal, Form, Input,
  InputNumber, message, Tag, Avatar, Tooltip, Row, Col, Progress, Popconfirm, Select
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  CrownOutlined, TeamOutlined, TrophyOutlined, GiftOutlined
} from '@ant-design/icons';
import { membershipApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;
const { Option } = Select;

const TIER_CONFIG = {
  'Khách Mới': { color: '#888', bg: '#f5f5f5', emoji: '👤', gradient: 'linear-gradient(135deg, #888, #aaa)' },
  Bronze:      { color: '#cd7f32', bg: '#fdf3e6', emoji: '🥉', gradient: 'linear-gradient(135deg, #cd7f32, #e8a87c)' },
  Đồng:        { color: '#cd7f32', bg: '#fdf3e6', emoji: '🥉', gradient: 'linear-gradient(135deg, #cd7f32, #e8a87c)' },
  Silver:      { color: '#a8a8a8', bg: '#f5f5f5', emoji: '🥈', gradient: 'linear-gradient(135deg, #a8a8a8, #d0d0d0)' },
  Bạc:         { color: '#a8a8a8', bg: '#f5f5f5', emoji: '🥈', gradient: 'linear-gradient(135deg, #a8a8a8, #d0d0d0)' },
  Gold:        { color: '#d4a017', bg: '#fffbe6', emoji: '🥇', gradient: 'linear-gradient(135deg, #d4a017, #f0c040)' },
  Vàng:        { color: '#d4a017', bg: '#fffbe6', emoji: '🥇', gradient: 'linear-gradient(135deg, #d4a017, #f0c040)' },
  Platinum:    { color: '#40a9ff', bg: '#e6f7ff', emoji: '💎', gradient: 'linear-gradient(135deg, #40a9ff, #91d5ff)' },
  'Bạch Kim':  { color: '#40a9ff', bg: '#e6f7ff', emoji: '💎', gradient: 'linear-gradient(135deg, #40a9ff, #91d5ff)' },
  Diamond:     { color: '#b37feb', bg: '#f9f0ff', emoji: '💠', gradient: 'linear-gradient(135deg, #b37feb, #d3adf7)' },
};

const getConfig = (name) => TIER_CONFIG[name] || { color: '#1677ff', bg: '#e6f4ff', emoji: '⭐', gradient: 'linear-gradient(135deg, #1677ff, #69b1ff)' };

const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await membershipApi.getAllMemberships();
      const raw = res.data;
      const data = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      setMemberships(data);
    } catch {
      message.error('Không thể tải hạng thành viên!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemberships(); }, []);

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      tierName: record.tierName,
      minPoints: record.minPoints,
      discountPercent: record.discountPercent,
      perks: record.perks || '',
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id, name) => {
    try {
      await membershipApi.deleteMembership(id);
      message.success('Đã xóa hạng thành viên!');
      addNotification('Xóa Hạng TV', `Đã xóa hạng: ${name}`, 'warning');
      fetchMemberships();
    } catch { message.error('Lỗi khi xóa!'); }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await membershipApi.updateMembership(editing.id, { ...editing, ...values });
        addNotification('Cập nhật Hạng TV', `Đã cập nhật: ${values.tierName}`, 'info');
      } else {
        await membershipApi.createMembership(values);
        addNotification('Hạng TV Mới', `Đã tạo: ${values.tierName} (${values.discountPercent}% giảm)`, 'success');
      }
      message.success(editing ? 'Cập nhật thành công!' : 'Thêm thành công!');
      setIsModalVisible(false);
      fetchMemberships();
    } catch { message.error('Lỗi khi lưu!'); }
  };

  const totalMembers = memberships.reduce((s, m) => s + (m.memberCount || 0), 0);
  const maxCount = Math.max(...memberships.map(m => m.memberCount || 0), 1);

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #d4a017 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(212,160,23,0.25)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <CrownOutlined style={{ marginRight: 10 }} />Hạng Thành Viên (Membership)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            Thiết lập cấp độ thành viên, điểm tích lũy và đặc quyền cho khách hàng trung thành.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Tổng hạng', value: memberships.length },
            { label: 'Tổng thành viên', value: totalMembers.toLocaleString('vi-VN') },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', minWidth: 100 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Tier Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {memberships.map(tier => {
          const cfg = getConfig(tier.tierName);
          const pct = totalMembers ? Math.round((tier.memberCount || 0) / totalMembers * 100) : 0;
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={tier.id}>
              <Card
                style={{ borderRadius: 16, border: 'none', boxShadow: `0 4px 20px ${cfg.color}25`, overflow: 'hidden', background: cfg.bg }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Header strip */}
                <div style={{ background: cfg.gradient, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 36 }}>{cfg.emoji}</div>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ color: 'white', fontWeight: 800, fontSize: 18, display: 'block' }}>{tier.tierName}</Text>
                    <Tag style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700 }}>
                      {tier.discountPercent}% OFF
                    </Tag>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Điểm tối thiểu</Text>
                      <Text strong style={{ color: cfg.color, fontSize: 15 }}>≥ {(tier.minPoints || 0).toLocaleString('vi-VN')} điểm</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Thành viên</Text>
                      <Text strong style={{ fontSize: 15 }}><TeamOutlined /> {(tier.memberCount || 0).toLocaleString('vi-VN')}</Text>
                    </div>
                  </div>
                  {tier.perks && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                      🎁 {tier.perks}
                    </Text>
                  )}
                  <Progress percent={pct} showInfo={false} size="small" strokeColor={cfg.color} trailColor={`${cfg.color}20`} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <Button size="small" icon={<EditOutlined />} style={{ color: cfg.color, borderColor: cfg.color }}
                      onClick={() => handleEdit(tier)}>
                      Chỉnh sửa
                    </Button>
                    <Popconfirm
                      title={`Xóa hạng "${tier.tierName}"?`}
                      description="Các thành viên đang ở hạng này sẽ mất liên kết."
                      onConfirm={() => handleDelete(tier.id, tier.tierName)}
                      okText="Xóa" cancelText="Hủy" okType="danger"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchMemberships} loading={loading}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#d4a017', borderColor: '#d4a017' }}
          onClick={() => { setEditing(null); form.resetFields(); setIsModalVisible(true); }}>
          Thêm Hạng Mới
        </Button>
      </div>

      {/* Table view */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={memberships}
          rowKey="id"
          loading={loading}
          pagination={false}
          style={{ borderRadius: 16, overflow: 'hidden' }}
          columns={[
            {
              title: 'Hạng', key: 'tier',
              render: (_, r) => {
                const cfg = getConfig(r.tierName);
                return (
                  <Space>
                    <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                    <Text strong style={{ color: cfg.color, fontSize: 14 }}>{r.tierName}</Text>
                  </Space>
                );
              }
            },
            { title: 'Điểm Tối Thiểu', dataIndex: 'minPoints', key: 'minPoints', render: v => <Text>{(v || 0).toLocaleString('vi-VN')} điểm</Text> },
            { title: 'Giảm Giá', dataIndex: 'discountPercent', key: 'discountPercent', render: v => <Tag color="gold" style={{ fontWeight: 700 }}>{v}% OFF</Tag> },
            { title: 'Thành Viên', dataIndex: 'memberCount', key: 'memberCount', render: v => <Text strong>{(v || 0).toLocaleString('vi-VN')}</Text> },
            { title: 'Đặc Quyền', dataIndex: 'perks', key: 'perks', render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text> },
            {
              title: 'Thao Tác', key: 'action', align: 'center', width: 100,
              render: (_, record) => (
                <Space>
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                  <Popconfirm title={`Xóa hạng "${record.tierName}"?`} onConfirm={() => handleDelete(record.id, record.tierName)} okText="Xóa" cancelText="Hủy" okType="danger">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editing ? `Cập nhật Hạng: ${editing.tierName}` : 'Thêm Hạng Thành Viên Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu" cancelText="Hủy"
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="tierName" label="Tên Hạng" rules={[{ required: true, message: 'Nhập tên hạng!' }]}>
            <Input placeholder="VD: Bronze, Silver, Gold, Platinum, Diamond" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="minPoints" label="Điểm Tối Thiểu" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 0, 500, 2000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountPercent" label="Mức Giảm (%)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} placeholder="VD: 5, 10, 15" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="perks" label="Đặc Quyền (mô tả)">
            <Input.TextArea rows={2} placeholder="VD: Free breakfast, Late checkout, Room upgrade..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MembershipsPage;
