import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Select, Alert, Modal, Form, InputNumber, Input, message, Tabs, Popconfirm, Space, Tag } from 'antd';
import { WarningOutlined, DeleteOutlined, FileTextOutlined, CheckSquareOutlined, ReloadOutlined } from '@ant-design/icons';
import { lossDamageApi } from '../../../api/lossDamageApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs'; // Thư viện format ngày tháng (cài sẵn trong dự án thường có)

const { Title, Text } = Typography;
const { Option } = Select;

// MOCK DATA: Chờ sau này bạn viết API lấy danh sách phòng & kho thì thay thế
// QUAN TRỌNG: bookingDetailId và id (của vật tư) phải TỒN TẠI trong bảng SQL của bạn!
const MOCK_ROOMS = [
  { id: '101', name: 'Phòng 101', bookingDetailId: 1 }, 
  { id: '102', name: 'Phòng 102', bookingDetailId: 2 },
];

const MOCK_CHECKLIST = [
  { id: 1, name: 'Smart TV Samsung 43 inch', defaultQty: 1 },
  { id: 2, name: 'Khăn tắm cotton 70x140cm', defaultQty: 2 },
  { id: 3, name: 'Ấm đun siêu tốc Sunhouse', defaultQty: 1 },
];

const LossCompensationPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(MOCK_ROOMS[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const [historyData, setHistoryData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const { addNotification } = useNotification();

  // Gọi API GET
  const fetchHistory = async () => {
    setTableLoading(true);
    try {
      const res = await lossDamageApi.getAllLossAndDamages();
      setHistoryData(res.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      message.error('Không thể tải lịch sử đền bù từ máy chủ!');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Mở Modal Báo hỏng
  const handleOpenReportModal = (item) => {
    setReportingItem(item);
    form.resetFields();
    form.setFieldsValue({ quantity: 1, penaltyAmount: 0 }); 
    setIsModalOpen(true);
  };

  // Gọi API POST
  const handleReportSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const currentRoom = MOCK_ROOMS.find(r => r.id === selectedRoom);

      // Payload bắn lên C# (Khớp với Model LossAndDamage)
      const payload = {
        roomInventoryId: reportingItem.id, // Id vật tư
        bookingDetailId: currentRoom.bookingDetailId, // Id đặt phòng
        quantity: values.quantity,
        penaltyAmount: values.penaltyAmount, 
        description: values.description || 'Nhân viên buồng phòng báo hỏng',
      };

      await lossDamageApi.createLossAndDamage(payload);
      
      message.success('Đã lưu biên bản đền bù thành công!');
      addNotification('Biên bản mới', `Ghi nhận hỏng: ${reportingItem.name} tại ${currentRoom.name}`, 'warning');
      
      setIsModalOpen(false);
      fetchHistory(); // Cập nhật lại bảng Lịch sử

    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      message.error('Lưu thất bại! (Kiểm tra lại Khóa Ngoại BookingDetailId hoặc RoomInventoryId có trong SQL chưa)');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Gọi API DELETE
  const handleDeleteRecord = async (id) => {
    try {
      await lossDamageApi.deleteLossAndDamage(id);
      message.success('Đã hủy biên bản thành công!');
      fetchHistory();
    } catch (error) {
      message.error('Lỗi khi xóa biên bản!');
    }
  };

  // Cột cho Bảng Kiểm tra (Tab 1)
  const checklistColumns = [
    { title: 'Tên vật tư', dataIndex: 'name', key: 'name' },
    { title: 'Số lượng chuẩn', dataIndex: 'defaultQty', key: 'defaultQty', align: 'center' },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button danger icon={<WarningOutlined />} onClick={() => handleOpenReportModal(record)}>
          Báo hỏng / Mất
        </Button>
      ),
    },
  ];

  // Cột cho Bảng Lịch sử (Tab 2) - Khớp với Dto của C#
  const historyColumns = [
    { 
      title: 'Ngày ghi nhận', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A'
    },
    { title: 'Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: text => <Tag color="blue">{text}</Tag> },
    { title: 'Vật tư', dataIndex: 'itemName', key: 'itemName', render: text => <Text strong>{text}</Text> },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { 
      title: 'Tiền phạt (VNĐ)', 
      dataIndex: 'penaltyAmount', 
      key: 'penaltyAmount',
      render: (val) => <Text type="danger" strong>{val?.toLocaleString('vi-VN')} đ</Text>
    },
    { title: 'Ghi chú', dataIndex: 'description', key: 'description' },
    { 
      title: 'Thao tác', 
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Popconfirm title="Hủy biên bản này?" onConfirm={() => handleDeleteRecord(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  // Khai báo Tabs (Chuẩn Ant Design v5)
  const tabItems = [
    {
      key: '1',
      label: <span><CheckSquareOutlined /> Kiểm tra phòng</span>,
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Text strong>Chọn phòng kiểm tra:</Text>
              <Select value={selectedRoom} onChange={setSelectedRoom} style={{ width: 150 }}>
                {MOCK_ROOMS.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
              </Select>
            </Space>
          </div>
          <Alert title="Nhân viên buồng phòng kiểm tra thực tế và nhấn 'Báo hỏng' nếu có thất thoát." type="info" showIcon style={{ marginBottom: 16 }} />
          <Table dataSource={MOCK_CHECKLIST} columns={checklistColumns} rowKey="id" pagination={false} bordered />
        </>
      )
    },
    {
      key: '2',
      label: <span><FileTextOutlined /> Lịch sử biên bản</span>,
      children: (
        <>
           <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={tableLoading}>
                 Làm mới dữ liệu
              </Button>
           </div>
           <Table dataSource={historyData} columns={historyColumns} rowKey="id" loading={tableLoading} bordered />
        </>
      )
    }
  ];

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', minHeight: '80vh' }}>
      <Title level={3} style={{ marginBottom: 24, color: '#1890ff' }}>Quản lý Thất thoát & Đền bù</Title>

      <Tabs defaultActiveKey="1" items={tabItems} />

      <Modal title={`Báo cáo hỏng/mất: ${reportingItem?.name}`} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleReportSubmit}>
          <Form.Item label="Số lượng hỏng/mất" name="quantity" rules={[{ required: true, message: 'Nhập số lượng!' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Số tiền phạt / đền bù (VNĐ)" name="penaltyAmount" rules={[{ required: true, message: 'Nhập số tiền!' }]}>
            <InputNumber min={0} step={10000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ghi chú chi tiết" name="description">
            <Input.TextArea rows={3} placeholder="Ví dụ: Vỡ màn hình TV..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" danger block loading={submitLoading}>
            Xác nhận tạo biên bản
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default LossCompensationPage;
