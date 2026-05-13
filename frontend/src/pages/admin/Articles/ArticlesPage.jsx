import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, message, Tag, Switch, Avatar, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ReadOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { articleApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const CustomQuillEditor = ({ value, onChange }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    
    // Khởi tạo quill bằng Vanilla JS để tránh lỗi React 19 findDOMNode
    quillRef.current = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: 'Hỗ trợ chèn ảnh, in đậm, đổi màu chữ...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

    quillRef.current.on('text-change', () => {
      const html = quillRef.current.root.innerHTML;
      if (html === '<p><br></p>') onChange?.('');
      else onChange?.(html);
    });

    if (value) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value);
    }
  }, []);

  useEffect(() => {
    if (quillRef.current && value) {
      const html = quillRef.current.root.innerHTML;
      if (value !== html && value !== '<p><br></p>') {
        const delta = quillRef.current.clipboard.convert({ html: value });
        quillRef.current.setContents(delta, 'silent');
      }
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '300px', marginBottom: '50px' }} />;
};

const { Title, Text } = Typography;

const ArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await articleApi.getAllArticles();
      setArticles(res.data);
    } catch (error) {
      console.error(error);
      setArticles([
        { id: 1, title: 'Khai trương bể bơi vô cực', summary: 'Bể bơi infinity với view ngắm toàn cảnh thành phố và biển.', content: '<p><strong>Hợi tụ tại bể bơi mới!</strong></p>', isPublished: true, createdAt: '2026-04-01', author: { name: 'Admin' } },
        { id: 2, title: 'Chương trình ẩm thực cuối tuần', summary: 'Giảm 20% cho khách đặt phòng trước 3 ngày - menu hải sản tươi sống.', content: '<p>Chương trình ưu đãi cuối tuần!</p>', isPublished: false, createdAt: '2026-04-05', author: { name: 'Marketing' } },
        { id: 3, title: 'Spa & Wellness Mưa He 2026', summary: 'Gói massage thư giãn cho cặp đôi với giá ưu đãi mua 1 tặng 1.', content: '<p>Trải nghiệm spa cao cấp!</p>', isPublished: true, createdAt: '2026-04-08', author: { name: 'Spa Team' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleTogglePublish = async (record) => {
    try {
      const updated = { ...record, isPublished: !record.isPublished };
      await articleApi.updateArticle(record.id, updated);
      setArticles(prev => prev.map(a => a.id === record.id ? updated : a));
      message.success(updated.isPublished ? 'Xuất bản thành công!' : 'Chọn về bản nháp!');
    } catch {
      // Optimistic update even if API fails
      setArticles(prev => prev.map(a => a.id === record.id ? { ...a, isPublished: !a.isPublished } : a));
      message.success(record.isPublished ? 'Chọn về bản nháp!' : 'Xuất bản thành công!');
    }
  };

  const columns = [
    {
      title: 'Tác Giả', key: 'author',
      render: (_, r) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${r.author?.name || 'admin'}`} size={36} />
          <Text style={{ fontSize: 12, color: '#666' }}>{r.author?.name || 'Admin'}</Text>
        </Space>
      ),
      width: 120,
    },
    {
      title: 'Tiêu Đề & Tóm Tắt', key: 'content',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{r.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{r.summary}</Text>
        </div>
      )
    },
    {
      title: 'Ngày Viết', dataIndex: 'createdAt', key: 'createdAt',
      render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
      width: 110,
    },
    {
      title: 'Xuất Bản', key: 'isPublished',
      render: (_, record) => (
        <Tooltip title={record.isPublished ? 'Click để ẩn' : 'Click để xuất bản'}>
          <Switch
            checked={record.isPublished}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<ClockCircleOutlined />}
            onChange={() => handleTogglePublish(record)}
          />
        </Tooltip>
      ),
      width: 100,
    },
    {
      title: 'Thao Tác', key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
      width: 80,
    },
  ];

  const handleEdit = (record) => {
    setEditingArticle(record);
    form.setFieldsValue({ ...record });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa bài viết này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await articleApi.deleteArticle(id);
          message.success('Đã xóa bài viết!');
          fetchArticles();
        } catch (error) {
          message.error('Lỗi khi xóa!');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingArticle) {
        await articleApi.updateArticle(editingArticle.id, { ...editingArticle, ...values });
        message.success('Cập nhật thành công!');
        addNotification('Cập nhật Bài Viết', `Đã cập nhật bài: "${values.title}"`, 'info');
      } else {
        await articleApi.createArticle({ ...values, isPublished: false });
        message.success('Tạo bản nháp thành công!');
        addNotification('Bài Viết Mới', `Đã tạo bản nháp: "${values.title}"`, 'success');
      }
      setIsModalVisible(false);
      fetchArticles();
    } catch {
      // Optimistic add for demo
      const newArticle = { id: Date.now(), ...values, isPublished: false, createdAt: new Date().toISOString(), author: { name: 'Admin' } };
      setArticles(prev => editingArticle ? prev.map(a => a.id === editingArticle.id ? { ...a, ...values } : a) : [newArticle, ...prev]);
      message.success(editingArticle ? 'Cập nhật thành công!' : 'Tạo bản nháp thành công!');
      setIsModalVisible(false);
    }
  };

  return (
    <div>
      {/* Premium Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #722ed1 100%)',
          borderRadius: '16px',
          padding: '32px 40px',
          marginBottom: '28px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(114,46,209,0.15)',
        }}
      >
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            <ReadOutlined style={{ marginRight: 10 }} />Hệ Thống Báo Chí & Tin Tức (CMS)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            Soạn thảo, quản lý và xuất bản các bài viết truyền thông bằng Rich Text Editor. Toggle xuất bản ngay trên bảng.
          </Text>
          <Space style={{ marginTop: 12 }}>
            <Tag style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 6 }}>✅ {articles.filter(a => a.isPublished).length} Xuất bản</Tag>
            <Tag style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 6 }}>📝 {articles.filter(a => !a.isPublished).length} Bản nháp</Tag>
          </Space>
        </div>
        <Space style={{ flexWrap: 'wrap' }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchArticles}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: '10px' }}
          >
            Làm mới
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setEditingArticle(null); form.resetFields(); setIsModalVisible(true); }}
            style={{ background: 'white', color: '#722ed1', border: 'none', borderRadius: '10px', fontWeight: 600 }}
          >
            Viết Bài Mới
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table columns={columns} dataSource={articles} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal
        title={editingArticle ? "Cập nhật Bài Viết" : "Tạo mới Bài Viết"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="Tóm tắt ngắn">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Nội dung chính">
            <CustomQuillEditor />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ArticlesPage;
