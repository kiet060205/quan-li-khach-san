import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Modal, message,
  Badge, Row, Col, Select, Input, Popconfirm, Descriptions, Timeline
} from 'antd';
import {
  ReloadOutlined, EyeOutlined, CheckOutlined, AppstoreOutlined,
  ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SearchOutlined, CarOutlined
} from '@ant-design/icons';
import { orderServiceApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_CONFIG = {
  Pending:    { color: 'orange', label: 'Chờ xử lý',      icon: <ClockCircleOutlined /> },
  Processing: { color: 'blue',   label: 'Đang thực hiện', icon: <SyncOutlined spin /> },
  Completed:  { color: 'green',  label: 'Hoàn thành',     icon: <CheckCircleOutlined /> },
  Delivered:  { color: 'green',  label: 'Đã giao',        icon: <CheckCircleOutlined /> },
  Cancelled:  { color: 'red',    label: 'Đã hủy',         icon: <CloseCircleOutlined /> },
};

const OrderServicesPage = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { addNotification } = useNotification();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderServiceApi.getAllOrderServices();
      const raw = res.data;
      const data = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      setOrders(data);
      setFiltered(data);
    } catch {
      message.error('Không thể tải đơn dịch vụ!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== 'ALL') result = result.filter(o => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.bookingCode?.toLowerCase().includes(q) ||
        o.guestName?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, orders]);

  const handleStatusChange = async (id, newStatus, guestName) => {
    try {
      await orderServiceApi.updateStatus(id, newStatus);
      const label = STATUS_CONFIG[newStatus]?.label || newStatus;
      message.success(`Cập nhật → ${label}`);
      addNotification('Cập nhật Đơn DV', `Đơn #${id} của ${guestName} → ${label}`, newStatus === 'Completed' || newStatus === 'Delivered' ? 'success' : 'info');
      fetchOrders();
    } catch { message.error('Lỗi cập nhật trạng thái!'); }
  };

  const handleDelete = async (id) => {
    try {
      await orderServiceApi.deleteOrderService(id);
      message.success('Đã hủy đơn!');
      addNotification('Hủy Đơn DV', `Đơn dịch vụ #${id} đã bị hủy.`, 'warning');
      fetchOrders();
    } catch { message.error('Lỗi hủy đơn!'); }
  };

  const columns = [
    { title: 'Đơn #', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Booking / Khách', key: 'booking',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#1677ff' }}>{r.bookingCode || '—'}</Text>
          <Text style={{ fontSize: 12 }}>{r.guestName || '—'}</Text>
        </Space>
      )
    },
    {
      title: 'Ngày Đặt', dataIndex: 'orderDate', key: 'orderDate',
      render: d => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{d ? dayjs(d).format('HH:mm') : ''}</Text>
        </Space>
      ),
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: 'Tổng Tiền', dataIndex: 'totalAmount', key: 'totalAmount',
      render: v => <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Trạng Thái', dataIndex: 'status', key: 'status',
      render: (s, record) => {
        const cfg = STATUS_CONFIG[s] || { color: 'default', label: s, icon: null };
        return (
          <Space wrap>
            <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 6, fontWeight: 600 }}>{cfg.label}</Tag>
            {s === 'Pending' && (
              <Button size="small" type="primary" ghost icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, 'Processing', record.guestName)}>
                Nhận đơn
              </Button>
            )}
            {s === 'Processing' && (
              <Button size="small" type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', border: 'none' }}
                onClick={() => handleStatusChange(record.id, 'Completed', record.guestName)}>
                Hoàn thành
              </Button>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Chi Tiết / Thao Tác', key: 'actions', width: 150,
      render: (_, record) => (
        <Space>
          <Badge count={record.items?.length || 0} size="small" style={{ backgroundColor: '#1677ff' }}>
            <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedOrder(record); setDetailModalOpen(true); }}>
              Xem
            </Button>
          </Badge>
          {(record.status === 'Pending' || record.status === 'Processing') && (
            <Popconfirm title="Hủy đơn dịch vụ này?" onConfirm={() => handleDelete(record.id)} okText="Hủy đơn" cancelText="Không" okType="danger">
              <Button danger size="small">Hủy</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const processingCount = orders.filter(o => o.status === 'Processing').length;
  const completedCount = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #fa8c16 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', boxShadow: '0 10px 30px rgba(250,140,22,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
              <AppstoreOutlined style={{ marginRight: 10 }} />Quản Lý Đơn Dịch Vụ
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Theo dõi, xử lý và cập nhật trạng thái các đơn dịch vụ phòng (ăn, spa, giặt ủi...).
            </Text>
          </div>
          <Row gutter={12}>
            {[
              { label: 'Chờ xử lý', value: pendingCount, color: 'rgba(255,77,79,0.3)' },
              { label: 'Đang làm', value: processingCount, color: 'rgba(105,177,255,0.3)' },
              { label: 'Hoàn thành', value: completedCount, color: 'rgba(82,196,26,0.3)' },
            ].map(s => (
              <Col key={s.label}>
                <div style={{ background: s.color, padding: '10px 14px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="Tìm theo booking, tên khách..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
          <Option value="ALL">Tất cả trạng thái</Option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Option key={key} value={key}>{cfg.label}</Option>
          ))}
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Làm mới</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} đơn` }}
          scroll={{ x: 950 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
          rowClassName={record => record.status === 'Pending' ? 'ant-table-row-urgent' : ''}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <AppstoreOutlined style={{ color: '#fa8c16' }} />
            Chi tiết Đơn #{selectedOrder?.id} — {selectedOrder?.guestName || 'Khách'}
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>,
          selectedOrder?.status === 'Pending' && (
            <Button key="accept" type="primary"
              onClick={() => { handleStatusChange(selectedOrder.id, 'Processing', selectedOrder.guestName); setDetailModalOpen(false); }}>
              Nhận đơn
            </Button>
          ),
          selectedOrder?.status === 'Processing' && (
            <Button key="done" type="primary" style={{ background: '#52c41a', border: 'none' }}
              onClick={() => { handleStatusChange(selectedOrder.id, 'Completed', selectedOrder.guestName); setDetailModalOpen(false); }}>
              Hoàn thành
            </Button>
          ),
        ].filter(Boolean)}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã Booking">{selectedOrder.bookingCode || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">{dayjs(selectedOrder.orderDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_CONFIG[selectedOrder.status]?.color || 'default'}>
                  {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                  {Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
              📦 Chi tiết sản phẩm / dịch vụ ({selectedOrder.items?.length || 0} mục):
            </Text>
            {selectedOrder.items?.length > 0 ? (
              <Table
                dataSource={selectedOrder.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Dịch Vụ', dataIndex: 'serviceName', key: 'serviceName' },
                  { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center', width: 60 },
                  { title: 'Đơn Giá', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: v => `${Number(v || 0).toLocaleString('vi-VN')} đ` },
                  { title: 'Thành Tiền', key: 'total', align: 'right', render: (_, r) => <Text strong>{Number((r.quantity || 1) * (r.unitPrice || 0)).toLocaleString('vi-VN')} đ</Text> },
                ]}
                summary={data => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={3}><Text strong>TỔNG CỘNG</Text></Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                          {Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <Text type="secondary">Không có chi tiết dịch vụ.</Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderServicesPage;
