import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Input, Tag, Space, Select, Row, Col, message, Popconfirm } from 'antd';
import { ReloadOutlined, AuditOutlined, DownloadOutlined } from '@ant-design/icons';
import { auditLogApi } from '../../../api/financeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ACTION_CONFIG = {
  INSERT: { color: 'green', label: 'TẠO MỚI' },
  CREATE: { color: 'green', label: 'TẠO MỚI' },
  UPDATE: { color: 'blue', label: 'CẬP NHẬT' },
  EDIT: { color: 'blue', label: 'CẬP NHẬT' },
  DELETE: { color: 'red', label: 'XÓA' },
  REMOVE: { color: 'red', label: 'XÓA' },
  LOGIN: { color: 'purple', label: 'ĐĂNG NHẬP' },
  LOGOUT: { color: 'orange', label: 'ĐĂNG XUẤT' },
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getAllAuditLogs();
      const data = res.data?.Events || res.data?.events || [];
      setLogs(data);
      setFiltered(data);
    } catch {
      setLogs([]);
      setFiltered([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = logs;
    if (actionFilter !== 'ALL') {
      result = result.filter(l => l.actionType?.toUpperCase() === actionFilter);
    }
    if (q) {
      result = result.filter(l =>
        l.actionType?.toLowerCase().includes(q) ||
        l.entityType?.toLowerCase().includes(q) ||
        l.message?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, logs, actionFilter]);

  const columns = [
    {
      title: 'THỜI GIAN', dataIndex: 'timestamp', key: 'timestamp', width: 155,
      render: d => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13, fontWeight: 500 }}>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{d ? dayjs(d).format('HH:mm:ss') : ''}</Text>
        </Space>
      )
    },
    {
      title: 'HÀNH ĐỘNG', dataIndex: 'actionType', key: 'actionType', width: 130,
      render: (a) => {
        const cfg = ACTION_CONFIG[a?.toUpperCase()] || { color: 'default', label: a };
        return (
          <Tag color={cfg.color} style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px' }}>
            {cfg.label || a}
          </Tag>
        );
      }
    },
    { title: 'ĐỐI TƯỢNG', dataIndex: 'entityType', key: 'entityType', width: 160, render: t => <Text strong>{t}</Text> },
    {
      title: 'NGƯỜI THỰC HIỆN', dataIndex: 'actor', key: 'actor', width: 200,
      render: (actor) => (
        <Space>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1677ff' }}>
            {actor ? actor.charAt(0).toUpperCase() : '?'}
          </div>
          <Text style={{ fontSize: 13 }}>{actor || '—'}</Text>
        </Space>
      )
    },
    { title: 'NỘI DUNG', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: 'THAO TÁC', key: 'action', width: 90, align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Xóa nhật ký?"
          description="Bạn có chắc chắn muốn xóa bản ghi này khỏi CSDL?"
          onConfirm={() => handleDelete(record.eventId)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger type="text" size="small">Xóa</Button>
        </Popconfirm>
      )
    }
  ];

  const handleDelete = async (id) => {
    try {
      await auditLogApi.deleteAuditLog(id);
      setLogs(prev => prev.filter(l => l.eventId !== id));
      message.success('Đã xóa nhật ký');
    } catch {
      message.error('Không thể xóa nhật ký');
    }
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Title level={2} style={{ margin: '0 0 20px 0', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, background: '#e6f4ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <AuditOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          </div>
          Theo dõi thao tác hệ thống.
        </Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
           <Input.Search
            placeholder="Tìm theo tên nhân viên, nội dung..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
            allowClear
            size="large"
          />
          <Select value={actionFilter} onChange={setActionFilter} style={{ width: 200 }} size="large">
            <Option value="ALL">Lọc theo vai trò</Option>
            {Object.entries(ACTION_CONFIG).filter((_, i) => i % 2 === 0).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <div style={{ flex: 1 }}></div>
          <Space>
            <Button icon={<DownloadOutlined />} size="large">Xuất theo bộ lọc</Button>
            <Button type="primary" icon={<DownloadOutlined />} size="large">Xuất toàn bộ</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchLogs} size="large">Đặt lại</Button>
          </Space>
        </div>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="eventId"
          loading={loading}
          pagination={{ pageSize: 15 }}
          expandable={{
            expandedRowRender: record => (
              <div style={{ padding: '16px 24px', background: '#fafafa', borderRadius: 8, margin: '8px 24px', border: '1px solid #f0f0f0' }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: '#1677ff', fontSize: 13 }}>TÓM TẮT HOẠT ĐỘNG CHI TIẾT</Text>
                <Row gutter={24}>
                  <Col span={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Dữ liệu cũ (Old Data):</Text>
                    <pre style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px dashed #d9d9d9', fontSize: 13, overflowX: 'auto', margin: 0, minHeight: 60 }}>
                      {record.changes?.oldData ? JSON.stringify(record.changes.oldData, null, 2) : <span style={{color: '#bfbfbf'}}>Không có dữ liệu</span>}
                    </pre>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Dữ liệu mới (New Data):</Text>
                    <pre style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px dashed #d9d9d9', fontSize: 13, overflowX: 'auto', margin: 0, minHeight: 60 }}>
                      {record.changes?.newData ? JSON.stringify(record.changes.newData, null, 2) : <span style={{color: '#bfbfbf'}}>Không có dữ liệu</span>}
                    </pre>
                  </Col>
                </Row>
              </div>
            )
          }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
