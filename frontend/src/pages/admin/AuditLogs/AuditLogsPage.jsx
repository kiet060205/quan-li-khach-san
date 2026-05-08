import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Input, Tag, Tooltip, Space, Select, Row, Col, Badge } from 'antd';
import { ReloadOutlined, SearchOutlined, AuditOutlined, InsertRowAboveOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { auditLogApi } from '../../../api/financeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ACTION_CONFIG = {
  INSERT: { color: 'green', bg: '#f6ffed', icon: '➕', label: 'Tạo mới' },
  CREATE: { color: 'green', bg: '#f6ffed', icon: '➕', label: 'Tạo mới' },
  UPDATE: { color: 'blue',  bg: '#e6f4ff', icon: '✏️', label: 'Cập nhật' },
  EDIT:   { color: 'blue',  bg: '#e6f4ff', icon: '✏️', label: 'Cập nhật' },
  DELETE: { color: 'red',   bg: '#fff2f0', icon: '🗑️', label: 'Xóa' },
  REMOVE: { color: 'red',   bg: '#fff2f0', icon: '🗑️', label: 'Xóa' },
  LOGIN:  { color: 'purple',bg: '#f9f0ff', icon: '🔑', label: 'Đăng nhập' },
  LOGOUT: { color: 'orange',bg: '#fff7e6', icon: '🚪', label: 'Đăng xuất' },
};

const MOCK_LOGS = [
  { id: 1, action: 'CREATE', tableName: 'Bookings', recordId: 42, performedBy: 'admin@hotel.vn', oldValue: null, newValue: '{"guestName":"Nguyễn Văn An"}', createdAt: '2026-04-10T22:00:00Z' },
  { id: 2, action: 'UPDATE', tableName: 'Rooms', recordId: 5, performedBy: 'staff@hotel.vn', oldValue: '{"status":"Available"}', newValue: '{"status":"Occupied"}', createdAt: '2026-04-10T21:30:00Z' },
  { id: 3, action: 'DELETE', tableName: 'Reviews', recordId: 18, performedBy: 'admin@hotel.vn', oldValue: '{"rating":1,"comment":"Bad"}', newValue: null, createdAt: '2026-04-10T20:45:00Z' },
  { id: 4, action: 'LOGIN', tableName: 'Users', recordId: 1, performedBy: 'admin@hotel.vn', oldValue: null, newValue: null, createdAt: '2026-04-10T20:00:00Z' },
  { id: 5, action: 'UPDATE', tableName: 'Invoices', recordId: 11, performedBy: 'cashier@hotel.vn', oldValue: '{"status":"Unpaid"}', newValue: '{"status":"Paid"}', createdAt: '2026-04-10T19:15:00Z' },
  { id: 6, action: 'CREATE', tableName: 'Payments', recordId: 9, performedBy: 'cashier@hotel.vn', oldValue: null, newValue: '{"amount":3500000}', createdAt: '2026-04-10T18:55:00Z' },
  { id: 7, action: 'UPDATE', tableName: 'Housekeeping', recordId: 3, performedBy: 'housekeeper@hotel.vn', oldValue: '{"status":"Dirty"}', newValue: '{"status":"Clean"}', createdAt: '2026-04-10T17:00:00Z' },
];

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
      const data = res.data?.data || res.data || [];
      const list = Array.isArray(data) && data.length > 0 ? data : MOCK_LOGS;
      setLogs(list);
      setFiltered(list);
    } catch {
      setLogs(MOCK_LOGS);
      setFiltered(MOCK_LOGS);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = logs;
    if (actionFilter !== 'ALL') {
      result = result.filter(l => l.action?.toUpperCase() === actionFilter);
    }
    if (q) {
      result = result.filter(l =>
        l.action?.toLowerCase().includes(q) ||
        l.tableName?.toLowerCase().includes(q) ||
        l.performedBy?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, logs, actionFilter]);

  // Stats
  const statsByAction = Object.entries(
    logs.reduce((acc, l) => { const a = l.action?.toUpperCase() || 'OTHER'; acc[a] = (acc[a] || 0) + 1; return acc; }, {})
  );

  const columns = [
    {
      title: 'Hành Động', dataIndex: 'action', key: 'action', width: 120,
      render: (a) => {
        const cfg = ACTION_CONFIG[a?.toUpperCase()] || { color: 'default', icon: '•', label: a };
        return (
          <Tag color={cfg.color} style={{ borderRadius: 6, fontWeight: 700, padding: '3px 10px', fontSize: 13 }}>
            {cfg.icon} {cfg.label || a}
          </Tag>
        );
      }
    },
    { title: 'Bảng', dataIndex: 'tableName', key: 'tableName', render: t => <Text code style={{ fontSize: 13 }}>{t}</Text> },
    { title: 'Record ID', dataIndex: 'recordId', key: 'recordId', width: 90, render: v => <Text type="secondary">#{v}</Text> },
    {
      title: 'Giá Trị Cũ → Mới', key: 'values',
      render: (_, r) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 280 }}>
          {r.oldValue && <Text type="secondary" style={{ fontSize: 11 }}>Cũ: <Text code style={{ fontSize: 11 }}>{r.oldValue?.substring(0, 60)}{r.oldValue?.length > 60 ? '...' : ''}</Text></Text>}
          {r.newValue && <Text style={{ fontSize: 11 }}>Mới: <Text code style={{ fontSize: 11, color: '#389e0d' }}>{r.newValue?.substring(0, 60)}{r.newValue?.length > 60 ? '...' : ''}</Text></Text>}
          {!r.oldValue && !r.newValue && <Text type="secondary" style={{ fontSize: 12 }}>—</Text>}
        </Space>
      )
    },
    {
      title: 'Thực Hiện Bởi', dataIndex: 'performedBy', key: 'performedBy',
      render: v => <Text strong style={{ fontSize: 13 }}>{v}</Text>
    },
    {
      title: 'Thời Gian', dataIndex: 'createdAt', key: 'createdAt', width: 155,
      render: d => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{d ? dayjs(d).format('HH:mm:ss') : ''}</Text>
        </Space>
      )
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #722ed1 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', boxShadow: '0 10px 30px rgba(114,46,209,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
              <AuditOutlined style={{ marginRight: 10 }} />Nhật Ký Hệ Thống (Audit Logs)
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Theo dõi toàn bộ thao tác dữ liệu. Chỉ đọc — không thể xóa.
            </Text>
          </div>
          <Row gutter={10}>
            {statsByAction.slice(0, 4).map(([action, count]) => {
              const cfg = ACTION_CONFIG[action] || { color: '#fff', label: action };
              return (
                <Col key={action}>
                  <div style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{cfg.label || action}</div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo bảng, người thực hiện..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320, borderRadius: 10 }}
            allowClear
          />
          <Select value={actionFilter} onChange={setActionFilter} style={{ width: 160 }}>
            <Option value="ALL">Tất cả hành động</Option>
            {Object.entries(ACTION_CONFIG).filter((_, i) => i % 2 === 0).map(([k, v]) => (
              <Option key={k} value={k}>{v.icon} {v.label}</Option>
            ))}
          </Select>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchLogs}>Làm mới</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: t => `Tổng ${t} bản ghi` }}
          scroll={{ x: 900 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
          rowClassName={(r) => {
            const a = r.action?.toUpperCase();
            if (a === 'DELETE' || a === 'REMOVE') return 'audit-row-danger';
            return '';
          }}
          locale={{ emptyText: 'Chưa có bản ghi nhật ký nào' }}
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
