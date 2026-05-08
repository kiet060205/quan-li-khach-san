import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Modal, Form, Input,
  InputNumber, Select, DatePicker, message, Tag, Progress, Popconfirm,
  Row, Col, Input as AntInput, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  GiftOutlined, ClockCircleOutlined, CheckCircleOutlined,
  StopOutlined, SearchOutlined, CopyOutlined
} from '@ant-design/icons';
import { voucherApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherApi.getAllVouchers();
      // API trả về { value: [...] }
      const raw = res.data;
      const data = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      setVouchers(data);
      setFiltered(data);
    } catch {
      message.error('Không thể tải danh sách voucher!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  // Filter logic
  useEffect(() => {
    let result = vouchers;
    if (statusFilter !== 'ALL') {
      result = result.filter(v => getVoucherStatus(v).key === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => v.code?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, statusFilter, vouchers]);

  const getVoucherStatus = (v) => {
    const now = dayjs();
    const isFull = v.usageLimit && (v.usedCount || 0) >= v.usageLimit;
    const isExpired = v.validTo && dayjs(v.validTo).isBefore(now, 'day');
    const notStarted = v.validFrom && dayjs(v.validFrom).isAfter(now, 'day');
    if (isFull) return { key: 'FULL', label: 'Hết lượt', color: 'default', icon: <StopOutlined /> };
    if (isExpired) return { key: 'EXPIRED', label: 'Hết hạn', color: 'red', icon: <StopOutlined /> };
    if (notStarted) return { key: 'PENDING', label: 'Chưa kích hoạt', color: 'orange', icon: <ClockCircleOutlined /> };
    return { key: 'ACTIVE', label: 'Đang hiệu lực', color: 'green', icon: <CheckCircleOutlined /> };
  };

  const columns = [
    {
      title: 'Mã Voucher', dataIndex: 'code', key: 'code',
      render: (text, record) => {
        const status = getVoucherStatus(record);
        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px', fontWeight: 700, letterSpacing: 1 }}>{text}</Tag>
              <Tooltip title="Sao chép mã">
                <Button size="small" type="text" icon={<CopyOutlined />}
                  onClick={() => { navigator.clipboard.writeText(text); message.success('Đã sao chép!'); }} />
              </Tooltip>
            </Space>
            <Tag icon={status.icon} color={status.color} style={{ fontSize: 11 }}>{status.label}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Loại / Mức Giảm', key: 'discount',
      render: (_, r) => {
        const isPct = r.discountType === 'Percentage' || r.discountType === 'PERCENT';
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 11, color: '#888' }}>{isPct ? 'Phần trăm' : 'Số tiền cố định'}</Text>
            <Text strong style={{ fontSize: 20, color: isPct ? '#722ed1' : '#d4380d' }}>
              {isPct ? `${r.discountValue}%` : `${Number(r.discountValue).toLocaleString('vi-VN')}đ`}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Đã Dùng / Giới Hạn', key: 'usage',
      render: (_, r) => {
        const used = r.usedCount || 0;
        const limit = r.usageLimit || 0;
        const pct = limit ? Math.min(100, Math.round(used / limit * 100)) : 0;
        return (
          <div style={{ minWidth: 130 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{used} / {limit || '∞'}</Text>
              <Text strong style={{ fontSize: 12, color: pct >= 100 ? '#cf1322' : pct >= 80 ? '#d46b08' : '#389e0d' }}>{pct}%</Text>
            </div>
            <Progress percent={pct} showInfo={false} size="small"
              strokeColor={pct >= 100 ? '#ff4d4f' : pct >= 80 ? '#fa8c16' : '#52c41a'} />
          </div>
        );
      }
    },
    {
      title: 'Hiệu Lực', key: 'validity',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>📅 {r.validFrom ? dayjs(r.validFrom).format('DD/MM/YYYY') : '—'}</Text>
          <Text style={{ fontSize: 12 }}>⏹ {r.validTo ? dayjs(r.validTo).format('DD/MM/YYYY') : '—'}</Text>
        </Space>
      )
    },
    {
      title: 'Đơn Tối Thiểu', dataIndex: 'minBookingValue', key: 'minBookingValue',
      render: v => v ? <Text style={{ fontSize: 13 }}>{Number(v).toLocaleString('vi-VN')}đ</Text> : <Text type="secondary">Không giới hạn</Text>
    },
    {
      title: 'Thao Tác', key: 'action', width: 100, align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="Xóa voucher này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okType="danger">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const handleEdit = (record) => {
    setEditingVoucher(record);
    form.setFieldsValue({
      ...record,
      discountType: record.discountType === 'PERCENT' ? 'Percentage' : record.discountType === 'FIXED_AMOUNT' ? 'Fixed' : record.discountType,
      validRange: record.validFrom && record.validTo ? [dayjs(record.validFrom), dayjs(record.validTo)] : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await voucherApi.deleteVoucher(id);
      message.success('Đã xóa voucher!');
      addNotification('Xóa Voucher', `Đã xóa voucher #${id}`, 'warning');
      fetchVouchers();
    } catch { message.error('Lỗi khi xóa!'); }
  };

  const handleSubmit = async (values) => {
    const { validRange, ...rest } = values;
    const payload = {
      ...rest,
      discountType: rest.discountType === 'Percentage' ? 'PERCENT' : rest.discountType === 'Fixed' ? 'FIXED_AMOUNT' : rest.discountType,
      validFrom: validRange?.[0]?.toISOString() || null,
      validTo: validRange?.[1]?.toISOString() || null,
    };
    try {
      if (editingVoucher) {
        await voucherApi.updateVoucher(editingVoucher.id, { ...editingVoucher, ...payload });
        addNotification('Cập nhật Voucher', `Đã cập nhật mã: ${values.code}`, 'info');
      } else {
        await voucherApi.createVoucher(payload);
        addNotification('Voucher Mới', `Đã tạo mã: ${values.code}`, 'success');
      }
      message.success(editingVoucher ? 'Cập nhật thành công!' : 'Tạo voucher thành công!');
      setIsModalVisible(false);
      fetchVouchers();
    } catch { message.error('Lỗi lưu dữ liệu!'); }
  };

  const active = vouchers.filter(v => getVoucherStatus(v).key === 'ACTIVE').length;
  const expired = vouchers.filter(v => ['EXPIRED', 'FULL'].includes(getVoucherStatus(v).key)).length;

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #722ed1 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(114,46,209,0.25)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <GiftOutlined style={{ marginRight: 10 }} />Quản Lý Mã Khuyến Mãi
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Tạo và theo dõi các voucher giảm giá. Hỗ trợ giảm %, giảm cố định, giới hạn lượt dùng.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Tổng voucher', value: vouchers.length, color: 'rgba(255,255,255,0.15)' },
            { label: 'Đang hiệu lực', value: active, color: 'rgba(82,196,26,0.3)' },
            { label: 'Hết hạn/lượt', value: expired, color: 'rgba(255,77,79,0.3)' },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: s.color, padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <AntInput.Search
          placeholder="Tìm theo mã voucher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
          prefix={<SearchOutlined />}
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
          <Option value="ALL">Tất cả trạng thái</Option>
          <Option value="ACTIVE">Đang hiệu lực</Option>
          <Option value="PENDING">Chưa kích hoạt</Option>
          <Option value="EXPIRED">Hết hạn</Option>
          <Option value="FULL">Hết lượt</Option>
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchVouchers}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => { setEditingVoucher(null); form.resetFields(); setIsModalVisible(true); }}>
          Tạo Voucher Mới
        </Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: t => `Tổng ${t} voucher` }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title={editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="Lưu" cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="code" label="Mã Voucher" rules={[{ required: true, message: 'Nhập mã voucher!' }]}>
                <Input placeholder="VD: SUMMER2026" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label="Loại Giảm" rules={[{ required: true }]}>
                <Select placeholder="Chọn loại giảm">
                  <Option value="Percentage">Phần trăm (%)</Option>
                  <Option value="Fixed">Số tiền cố định (đ)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountValue" label="Mức Giảm" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 10 hoặc 500000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Giới Hạn Sử Dụng">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Để trống = vô hạn" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="validRange" label="Thời Gian Hiệu Lực">
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={['Ngày bắt đầu', 'Ngày kết thúc']} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="minBookingValue" label="Giá trị đơn tối thiểu (VNĐ)">
                <InputNumber
                  style={{ width: '100%' }} min={0}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/,/g, '')}
                  placeholder="0 = không giới hạn"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default VouchersPage;
