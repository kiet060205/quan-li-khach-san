import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Modal, Form,
  InputNumber, Select, message, Row, Col, Popconfirm, Input, Statistic, Divider
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ReloadOutlined, CreditCardOutlined,
  SearchOutlined, CheckCircleOutlined, FilterOutlined
} from '@ant-design/icons';
import { paymentApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const METHOD_CONFIG = {
  Cash: { icon: '💵', color: '#52c41a', label: 'Tiền mặt' },
  Card: { icon: '💳', color: '#1677ff', label: 'Thẻ' },
  'Credit Card': { icon: '💳', color: '#1677ff', label: 'Thẻ tín dụng' },
  Transfer: { icon: '🏦', color: '#722ed1', label: 'Chuyển khoản' },
  Online: { icon: '📱', color: '#fa8c16', label: 'Online' },
  VNPay: { icon: '📲', color: '#d32f2f', label: 'VNPay' },
  MoMo: { icon: '🌸', color: '#e91e8c', label: 'MoMo' },
  Other: { icon: '🔁', color: '#666', label: 'Khác' },
};

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAllPayments();
      const raw = res.data;
      const data = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      setPayments(data);
      setFiltered(data);
    } catch {
      message.error('Không thể tải dữ liệu thanh toán!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  useEffect(() => {
    let result = payments;
    if (methodFilter !== 'ALL') result = result.filter(p => p.paymentMethod === methodFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.bookingCode?.toLowerCase().includes(q) ||
        p.guestName?.toLowerCase().includes(q) ||
        p.transactionCode?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, methodFilter, payments]);

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
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
      title: 'Số Tiền', dataIndex: 'amountPaid', key: 'amountPaid',
      render: v => <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text>,
      sorter: (a, b) => a.amountPaid - b.amountPaid,
    },
    {
      title: 'Phương Thức', dataIndex: 'paymentMethod', key: 'paymentMethod',
      render: m => {
        const cfg = METHOD_CONFIG[m] || { icon: '💳', color: '#1677ff', label: m };
        return (
          <Tag style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 8, padding: '2px 10px', fontWeight: 600 }}>
            {cfg.icon} {cfg.label || m}
          </Tag>
        );
      }
    },
    {
      title: 'Mã Giao Dịch', dataIndex: 'transactionCode', key: 'transactionCode',
      render: t => t ? <Text code style={{ fontSize: 12 }}>{t}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Ngày Thanh Toán', dataIndex: 'paymentDate', key: 'paymentDate',
      render: d => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{d ? dayjs(d).format('HH:mm') : ''}</Text>
        </Space>
      ),
      sorter: (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate),
    },
    {
      title: 'TT Hóa Đơn', dataIndex: 'invoiceStatus', key: 'invoiceStatus',
      render: s => {
        const map = { Paid: { color: 'green', label: 'Đã TT' }, Unpaid: { color: 'red', label: 'Chưa TT' }, Partial: { color: 'orange', label: 'Một phần' } };
        const cfg = map[s] || { color: 'default', label: s };
        return <Tag color={cfg.color} style={{ borderRadius: 6, fontWeight: 600 }}>{cfg.label}</Tag>;
      }
    },
    {
      title: 'Thao Tác', key: 'action', width: 80, align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Hủy giao dịch?"
          description="Xóa sẽ ảnh hưởng đến trạng thái hóa đơn liên quan."
          onConfirm={() => handleDelete(record.id)}
          okText="Xóa" cancelText="Hủy" okType="danger"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ];

  const handleDelete = async (id) => {
    try {
      await paymentApi.deletePayment(id);
      message.success('Đã hủy giao dịch!');
      addNotification('Hủy Thanh Toán', `Đã hủy giao dịch #${id}`, 'warning');
      fetchPayments();
    } catch { message.error('Lỗi khi xóa!'); }
  };

  const handleSubmit = async (values) => {
    try {
      await paymentApi.createPayment(values);
      const methodLabel = METHOD_CONFIG[values.paymentMethod]?.label || values.paymentMethod;
      message.success('Ghi nhận thanh toán thành công!');
      addNotification('Thanh Toán Mới', `Ghi nhận ${Number(values.amountPaid).toLocaleString('vi-VN')} đ qua ${methodLabel}`, 'success');
      setIsModalVisible(false);
      form.resetFields();
      fetchPayments();
    } catch { message.error('Lỗi lưu thanh toán!'); }
  };

  const totalRevenue = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
  const uniqueMethods = [...new Set(payments.map(p => p.paymentMethod).filter(Boolean))];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', boxShadow: '0 10px 30px rgba(22,119,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
              <CreditCardOutlined style={{ marginRight: 10 }} />Lịch Sử Thanh Toán
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Theo dõi tất cả giao dịch thanh toán. Ghi nhận thu tiền mới cho hóa đơn.
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{Number(totalRevenue).toLocaleString('vi-VN')} đ</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Tổng thu ({payments.length} GD)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Method Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {Object.entries(METHOD_CONFIG).filter(([key]) => uniqueMethods.includes(key)).map(([method, cfg]) => {
          const methodPayments = payments.filter(p => p.paymentMethod === method);
          const total = methodPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={method}>
              <Card style={{ borderRadius: 12, border: `1px solid ${cfg.color}30`, textAlign: 'center', cursor: 'pointer', background: methodFilter === method ? `${cfg.color}10` : '#fff' }}
                styles={{ body: { padding: '12px 10px' } }}
                onClick={() => setMethodFilter(methodFilter === method ? 'ALL' : method)}>
                <div style={{ fontSize: 24 }}>{cfg.icon}</div>
                <Text strong style={{ fontSize: 12, display: 'block', color: cfg.color }}>{cfg.label}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>{methodPayments.length} GD · {Number(total).toLocaleString('vi-VN')}đ</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="Tìm theo booking, tên khách, mã GD..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={methodFilter} onChange={setMethodFilter} style={{ width: 180 }}>
          <Option value="ALL">Tất cả phương thức</Option>
          {uniqueMethods.map(m => <Option key={m} value={m}>{METHOD_CONFIG[m]?.label || m}</Option>)}
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchPayments}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
          Ghi Nhận Thanh Toán
        </Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} giao dịch` }}
          scroll={{ x: 1000 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title="Ghi Nhận Thanh Toán Mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Ghi nhận" cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="invoiceId" label="ID Hóa Đơn" rules={[{ required: true, message: 'Nhập ID hóa đơn!' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Nhập ID hóa đơn cần thanh toán" min={1} />
          </Form.Item>
          <Form.Item name="amountPaid" label="Số Tiền Thanh Toán (VNĐ)" rules={[{ required: true, message: 'Nhập số tiền!' }]}>
            <InputNumber
              style={{ width: '100%' }} min={1000}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => v.replace(/,/g, '')}
              placeholder="VD: 1.500.000"
            />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương Thức Thanh Toán" rules={[{ required: true }]}>
            <Select placeholder="Chọn phương thức">
              <Option value="Cash">💵 Tiền mặt</Option>
              <Option value="Credit Card">💳 Thẻ tín/ghi nợ</Option>
              <Option value="Transfer">🏦 Chuyển khoản</Option>
              <Option value="VNPay">📲 VNPay</Option>
              <Option value="MoMo">🌸 MoMo</Option>
              <Option value="Online">📱 Online khác</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transactionCode" label="Mã Giao Dịch (nếu có)">
            <Input placeholder="VD: TXN20260508001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
