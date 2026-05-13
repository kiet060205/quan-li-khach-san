import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, InputNumber, Select, message, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { paymentApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const MOCK_PAYMENTS = [
    { id: 1, bookingCode: 'BK-001', guestName: 'Nguyễn Văn An', amountPaid: 4070000, paymentMethod: 'Cash', transactionCode: 'TXN001', paymentDate: '2026-04-10T10:00:00Z', invoiceStatus: 'Paid' },
    { id: 2, bookingCode: 'BK-002', guestName: 'Trần Thị Bích', amountPaid: 7000000, paymentMethod: 'Transfer', transactionCode: 'TXN002', paymentDate: '2026-04-09T14:30:00Z', invoiceStatus: 'Partial' },
    { id: 3, bookingCode: 'BK-003', guestName: 'Lê Văn Cường', amountPaid: 2310000, paymentMethod: 'Card', transactionCode: 'TXN003', paymentDate: '2026-04-08T09:00:00Z', invoiceStatus: 'Paid' },
    { id: 4, bookingCode: 'BK-004', guestName: 'Phạm Thị Dung', amountPaid: 1500000, paymentMethod: 'Online', transactionCode: 'TXN004', paymentDate: '2026-04-07T16:00:00Z', invoiceStatus: 'Paid' },
    { id: 5, bookingCode: 'BK-005', guestName: 'Hoàng Minh', amountPaid: 3200000, paymentMethod: 'Cash', transactionCode: null, paymentDate: '2026-04-06T11:00:00Z', invoiceStatus: 'Paid' },
  ];

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAllPayments();
      const data = res.data?.data || res.data || [];
      setPayments(Array.isArray(data) && data.length > 0 ? data : MOCK_PAYMENTS);
    } catch { setPayments(MOCK_PAYMENTS); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const METHOD_ICON = {
    Cash: '💵', Card: '💳', Transfer: '🏦', Online: '📱', Other: '🔁',
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Mã Booking', dataIndex: 'bookingCode', key: 'bookingCode', render: t => <Text strong style={{ color: '#1677ff' }}>{t || '—'}</Text> },
    { title: 'Khách Hàng', dataIndex: 'guestName', key: 'guestName' },
    {
      title: 'Số Tiền', dataIndex: 'amountPaid', key: 'amountPaid',
      render: v => <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{Number(v).toLocaleString('vi-VN')} đ</Text>
    },
    {
      title: 'Phương Thức', dataIndex: 'paymentMethod', key: 'paymentMethod',
      render: m => <Tag icon={<span>{METHOD_ICON[m] || '💳'}</span>} color="blue" style={{ borderRadius: 6 }}>{m}</Tag>
    },
    { title: 'Mã Giao Dịch', dataIndex: 'transactionCode', key: 'transactionCode', render: t => t ? <Text code>{t}</Text> : '—' },
    {
      title: 'Ngày Thanh Toán', dataIndex: 'paymentDate', key: 'paymentDate',
      render: d => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'
    },
    {
      title: 'TT Hóa Đơn', dataIndex: 'invoiceStatus', key: 'invoiceStatus',
      render: s => {
        const map = { Paid: 'green', Unpaid: 'red', Partial: 'orange' };
        return <Tag color={map[s] || 'default'}>{s}</Tag>;
      }
    },
    {
      title: 'Thao Tác', key: 'action',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      )
    }
  ];

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Hủy giao dịch thanh toán này?',
      content: 'Lưu ý: Xóa sẽ ảnh hưởng đến trạng thái hóa đơn liên quan.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await paymentApi.deletePayment(id);
          message.success('Đã hủy giao dịch!');
          addNotification('Hủy Thanh Toán', `Đã hủy giao dịch #${id}`, 'warning');
          fetchPayments();
        } catch (e) { message.error('Lỗi khi xóa!'); }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      await paymentApi.createPayment(values);
      message.success('Ghi nhận thanh toán thành công!');
      addNotification('Thanh Toán Mới', `Ghi nhận ${Number(values.amountPaid).toLocaleString('vi-VN')} đ qua ${values.paymentMethod}`, 'success');
      setIsModalVisible(false);
      form.resetFields();
      fetchPayments();
    } catch (e) { message.error('Lỗi lưu thanh toán!'); }
  };

  const totalRevenue = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
  const methodStats = Object.entries(
    payments.reduce((acc, p) => { acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + (Number(p.amountPaid) || 0); return acc; }, {})
  );

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #52c41a 100%)', borderRadius: 16, padding: '32px 40px', marginBottom: 28, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(82,196,26,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            <CreditCardOutlined style={{ marginRight: 10 }} />Lịch Sử Thanh Toán
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
            Theo dõi tất cả các giao dịch thanh toán và ghi nhận thu tiền mới.
          </Text>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{Number(totalRevenue).toLocaleString('vi-VN')} đ</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Tổng thu ({payments.length} giao dịch)</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchPayments}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setIsModalVisible(true); }}>
          Ghi Nhận Thanh Toán
        </Button>
      </div>

      {/* Method Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {Object.entries({ Cash: '💵', Card: '💳', Transfer: '🏦', Online: '📱' }).map(([method, icon]) => {
          const total = payments.filter(p => p.paymentMethod === method).reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
          const count = payments.filter(p => p.paymentMethod === method).length;
          return (
            <Col xs={12} sm={6} key={method}>
              <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }} styles={{ body: { padding: '14px 12px' } }}>
                <div style={{ fontSize: 28 }}>{icon}</div>
                <Text strong style={{ fontSize: 13, display: 'block' }}>{method}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{count} lần · {Number(total).toLocaleString('vi-VN')}đ</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={payments} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} style={{ borderRadius: 16, overflow: 'hidden' }} />
      </Card>

      <Modal title="Ghi Nhận Thanh Toán Mới" open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="invoiceId" label="ID Hóa Đơn" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Nhập ID hóa đơn cần thanh toán" />
          </Form.Item>
          <Form.Item name="amountPaid" label="Số Tiền Thanh Toán (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương Thức Thanh Toán" rules={[{ required: true }]}>
            <Select>
              <Option value="Cash">Tiền mặt 💵</Option>
              <Option value="Card">Thẻ tín/ghi nợ 💳</Option>
              <Option value="Transfer">Chuyển khoản 🏦</Option>
              <Option value="Online">Ví điện tử / Online 📱</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transactionCode" label="Mã Giao Dịch (nếu có)">
            <InputNumber style={{ width: '100%' }} placeholder="VD: TXN20260409001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
