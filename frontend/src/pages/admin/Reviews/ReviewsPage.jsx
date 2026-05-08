import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Rate, Modal, message,
  Avatar, Tag, Row, Col, Input, Progress, Popconfirm, Select
} from 'antd';
import {
  DeleteOutlined, ReloadOutlined, UserOutlined, StarOutlined,
  MessageOutlined, CheckOutlined, SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import { reviewApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [replyModal, setReplyModal] = useState({ open: false, review: null, text: '' });
  const { addNotification } = useNotification();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getAllReviews();
      const raw = res.data;
      // API trả về { value: [...] }
      const data = raw?.value || raw?.data || (Array.isArray(raw) ? raw : []);
      // Normalize: user field có thể là object hoặc nested
      const normalized = data.map(r => ({
        ...r,
        userName: r.user?.fullName || r.user?.name || r.userName || 'Khách ẩn danh',
        roomTypeName: r.roomType?.name || r.roomTypeName || '—',
      }));
      setReviews(normalized);
      setFiltered(normalized);
    } catch {
      message.error('Không thể tải đánh giá!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    let result = reviews;
    if (ratingFilter !== 'ALL') result = result.filter(r => r.rating === Number(ratingFilter));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.comment?.toLowerCase().includes(q) ||
        r.userName?.toLowerCase().includes(q) ||
        r.roomTypeName?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, ratingFilter, reviews]);

  const handleDelete = async (id) => {
    try {
      await reviewApi.deleteReview(id);
      message.success('Đã xóa đánh giá!');
      addNotification('Xóa Đánh Giá', 'Đã xóa một đánh giá vi phạm.', 'warning');
      fetchReviews();
    } catch { message.error('Lỗi khi xóa!'); }
  };

  const handleReply = (review) => {
    setReplyModal({ open: true, review, text: review.reply || '' });
  };

  const submitReply = async () => {
    // Lưu reply vào state (API reply có thể chưa có endpoint riêng)
    setReviews(prev => prev.map(r =>
      r.id === replyModal.review.id ? { ...r, reply: replyModal.text } : r
    ));
    message.success('Đã gửi phản hồi!');
    addNotification('Phản Hồi Đánh Giá', `Đã phản hồi đánh giá của ${replyModal.review.userName}`, 'success');
    setReplyModal({ open: false, review: null, text: '' });
  };

  // Stats
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0,
  }));
  const needsReply = reviews.filter(r => !r.reply).length;

  const columns = [
    {
      title: 'Khách Hàng', key: 'user', width: 200,
      render: (_, r) => (
        <Space>
          <Avatar
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${r.userName}&backgroundColor=1677ff&textColor=ffffff`}
            size={40}
          />
          <div>
            <Text strong style={{ display: 'block' }}>{r.userName}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(r.createdAt).format('DD/MM/YYYY')}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Loại Phòng', dataIndex: 'roomTypeName', key: 'roomTypeName', width: 160,
      render: t => <Tag color="blue" style={{ borderRadius: 6 }}>{t}</Tag>
    },
    {
      title: 'Đánh Giá', dataIndex: 'rating', key: 'rating', width: 140,
      render: val => (
        <Space direction="vertical" size={2}>
          <Rate disabled value={val} style={{ fontSize: 13 }} />
          <Text style={{ fontSize: 11, color: val >= 4 ? '#52c41a' : val >= 3 ? '#fa8c16' : '#ff4d4f', fontWeight: 600 }}>
            {val >= 4 ? '😊 Tốt' : val >= 3 ? '😐 Trung bình' : '😞 Cần cải thiện'}
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Nhận Xét & Phản Hồi', key: 'comment',
      render: (_, r) => (
        <div>
          <Text style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>{r.comment || '—'}</Text>
          {r.reply && (
            <div style={{ background: '#f0f7ff', borderLeft: '3px solid #1677ff', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>↩ PHẢN HỒI TỪ KHÁCH SẠN:</Text>
              <br />
              <Text style={{ fontSize: 13, color: '#1677ff' }}>{r.reply}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thao Tác', key: 'action', width: 130,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Button
            type={record.reply ? 'default' : 'primary'}
            ghost={!!record.reply}
            size="small"
            icon={record.reply ? <CheckOutlined /> : <MessageOutlined />}
            onClick={() => handleReply(record)}
            style={{ width: '100%' }}
          >
            {record.reply ? 'Sửa phản hồi' : 'Phản hồi'}
          </Button>
          <Popconfirm
            title="Xóa đánh giá vi phạm?"
            description="Chỉ xóa khi đánh giá vi phạm quy tắc cộng đồng."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa" cancelText="Hủy" okType="danger"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} style={{ width: '100%' }}>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #eb2f96 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(235,47,150,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <StarOutlined style={{ marginRight: 10 }} />Đánh Giá Khách Hàng
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Theo dõi và phản hồi đánh giá từ khách lưu trú. Quản lý uy tín thương hiệu.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Điểm TB', value: `${avgRating}⭐`, highlight: true },
            { label: 'Tổng đánh giá', value: reviews.length },
            { label: 'Chờ phản hồi', value: needsReply, warning: needsReply > 0 },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: s.warning ? 'rgba(255,77,79,0.35)' : 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: s.highlight ? 20 : 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Rating Distribution */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>📊 Phân Bố Đánh Giá</Title>
        <Row gutter={24} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#faad14', lineHeight: 1 }}>{avgRating}</div>
            <Rate disabled value={parseFloat(avgRating)} allowHalf style={{ fontSize: 20 }} />
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>Dựa trên {reviews.length} đánh giá</Text>
          </Col>
          <Col xs={24} sm={16}>
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
                onClick={() => setRatingFilter(ratingFilter === String(star) ? 'ALL' : String(star))}>
                <Text style={{ width: 20, textAlign: 'right', fontWeight: ratingFilter === String(star) ? 700 : 400 }}>{star}</Text>
                <StarOutlined style={{ color: '#faad14', fontSize: 13 }} />
                <Progress percent={pct} showInfo={false} size="small" style={{ flex: 1, margin: '0 8px' }}
                  strokeColor={star >= 4 ? '#52c41a' : star === 3 ? '#fa8c16' : '#ff4d4f'} />
                <Text type="secondary" style={{ width: 35 }}>{count} ({pct}%)</Text>
              </div>
            ))}
          </Col>
        </Row>
      </Card>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="Tìm theo tên khách, nội dung, loại phòng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />
        <Select value={ratingFilter} onChange={setRatingFilter} style={{ width: 170 }}>
          <Option value="ALL">Tất cả sao</Option>
          {[5, 4, 3, 2, 1].map(s => (
            <Option key={s} value={String(s)}>{s} sao ({'⭐'.repeat(s)})</Option>
          ))}
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchReviews}>Làm mới</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: t => `Tổng ${t} đánh giá` }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        />
      </Card>

      {/* Reply Modal */}
      <Modal
        title={<Space><MessageOutlined style={{ color: '#1677ff' }} />Phản Hồi Đánh Giá của {replyModal.review?.userName}</Space>}
        open={replyModal.open}
        onCancel={() => setReplyModal({ open: false, review: null, text: '' })}
        onOk={submitReply}
        okText="Gửi Phản Hồi"
        cancelText="Hủy"
      >
        {replyModal.review && (
          <div>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Rate disabled value={replyModal.review.rating} style={{ fontSize: 14 }} />
              <Text style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{replyModal.review.comment}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Nội dung phản hồi:</Text>
            <TextArea
              rows={4}
              value={replyModal.text}
              onChange={e => setReplyModal(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Cảm ơn quý khách đã chia sẻ. Chúng tôi sẽ cải thiện..."
              showCount
              maxLength={500}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
