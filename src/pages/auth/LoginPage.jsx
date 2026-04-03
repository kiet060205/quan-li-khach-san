import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Checkbox, Row, Col } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Đã thêm công cụ giải mã JWT ở đây

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // GỌI API .NET THỰC TẾ
      const res = await axios.post('http://localhost:5262/api/Auth/login', {
        email: values.email,
        password: values.password
      });

      // Lấy token từ kết quả API trả về
      const token = res.data.token; 
      
      // ================= CẢI TIẾN TRÍCH XUẤT DỮ LIỆU THẬT =================
      // 1. Dùng công cụ giải mã cái Token ra thành 1 Object
      const decodedToken = jwtDecode(token);
      
      // 2. Lôi Tên và Quyền ra từ Token của .NET
      const realName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] 
                        || decodedToken.name 
                        || decodedToken.FullName 
                        || 'Người dùng ẩn danh';
                        
      const realRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                        || decodedToken.role 
                        || decodedToken.Role 
                        || 'Nhân viên';

      // 3. Đưa thông tin THẬT vào "Kho" Zustand
      setAuth(token, { name: realName, role: realRole }); 
      // ====================================================================
      
      message.success('Đăng nhập thành công!');
      navigate('/admin/roles'); // Chuyển thẳng vào trang Admin

    } catch (error) {
      console.error(error);
      message.error('Sai email hoặc mật khẩu, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      // Dùng ảnh nền khách sạn sang trọng từ Unsplash
      backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Lớp phủ mờ màu đen để làm nổi bật Form đăng nhập */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      
      <Card style={{ 
        width: 450, 
        zIndex: 1, 
        borderRadius: '12px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        padding: '10px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0, letterSpacing: '2px' }}>STK6</Title>
          <Text type="secondary">Hệ thống quản lý khách sạn cao cấp</Text>
        </div>

        <Form name="login_form" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Email (VD: admin@hotel.com)" />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu (VD: hash1)" />
          </Form.Item>

          <Form.Item>
            <Row justify="space-between">
              <Col>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ tôi</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <a style={{ color: '#1890ff' }} href="#">Quên mật khẩu?</a>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '45px', fontSize: '16px', fontWeight: '500' }}>
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Text type="secondary">Bạn chưa có tài khoản? </Text>
            <Link to="/register" style={{ fontWeight: 'bold' }}>Đăng ký ngay</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;