import React, { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';
import axiosClient from '../../api/axiosClient';

import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, FileTextOutlined, CreditCardOutlined
} from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const statusMap = {
  Pending: { label: 'Chờ Xác Nhận', color: '#f59e0b', bg: '#fef9ee', icon: <ClockCircleOutlined /> },
  Confirmed: { label: 'Đã Xác Nhận', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
  CheckedIn: { label: 'Đang Lưu Trú', color: '#3b82f6', bg: '#eff6ff', icon: <CheckCircleOutlined /> },
  CheckedOut: { label: 'Đã Trả Phòng', color: '#6b7280', bg: '#f9fafb', icon: <CheckCircleOutlined /> },
  Cancelled: { label: 'Đã Hủy', color: '#ef4444', bg: '#fef2f2', icon: <CloseCircleOutlined /> },
};

const payMethods = [
  { key: 'cash', label: 'Tiền Mặt', icon: '💵', desc: 'Thanh toán tại quầy lễ tân' },
  { key: 'bank', label: 'Chuyển Khoản', icon: '🏦', desc: 'Chuyển khoản qua ngân hàng' },
  { key: 'card', label: 'Thẻ Tín Dụng', icon: '💳', desc: 'Visa, Mastercard, JCB' },
  { key: 'momo', label: 'Ví MoMo', icon: '📱', desc: 'Thanh toán qua ví điện tử' },
];

export default function PaymentPage() {
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [paying, setPaying] = useState(false);
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      message.info('Vui lòng đăng nhập để xem đặt phòng và thanh toán!');
      navigate('/website-login');
      return;
    }
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    Promise.all([
      bookingApi.getByUser(userId).catch(() => ({ data: [] })),
      axiosClient.get('/Invoices').catch(() => ({ data: [] })),
    ]).then(([bRes, iRes]) => {
      const userBookings = Array.isArray(bRes.data) ? bRes.data : [];
      const allInvoices = Array.isArray(iRes.data) ? iRes.data : [];
      setBookings(userBookings);

      // Filter invoice theo bookingId (int) HOẶC bookingCode (string) của user
      const userBookingIds = new Set(userBookings.map(b => b.id));
      const userBookingCodes = new Set(userBookings.map(b => b.bookingCode));
      const userInvoices = allInvoices.filter(inv =>
        userBookingIds.has(inv.bookingId) || userBookingCodes.has(inv.bookingCode)
      );
      setInvoices(userInvoices);
    }).finally(() => setLoading(false));
  }, [token, user?.id]);

  // Helper để reload sau thanh toán
  const reloadInvoices = async (userBookings) => {
    const iRes = await axiosClient.get('/Invoices').catch(() => ({ data: [] }));
    const allInvoices = Array.isArray(iRes.data) ? iRes.data : [];
    const userBookingIds = new Set(userBookings.map(b => b.id));
    const userBookingCodes = new Set(userBookings.map(b => b.bookingCode));
    setInvoices(allInvoices.filter(inv =>
      userBookingIds.has(inv.bookingId) || userBookingCodes.has(inv.bookingCode)
    ));
  };


  const handlePay = async () => {
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      await axiosClient.post('/Payments', {
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.finalTotal,
        method: payMethod,
        paidAt: new Date().toISOString(),
        status: 'Paid',
      });
      message.success('Thanh toán thành công! Cảm ơn quý khách.');
      setPayModal(false);
      setSelectedInvoice(null);
      // Reload đúng invoice của user, không load hết
      await reloadInvoices(bookings);
    } catch {
      message.error('Thanh toán thất bại. Vui lòng thử lại!');
    } finally {
      setPaying(false);
    }

  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
  const formatCurrency = (n) => (n || 0).toLocaleString('vi-VN') + ' ₫';

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero */}
      <section style={{ background: DARK, padding: '48px 5vw 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>TÀI KHOẢN CỦA TÔI</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, margin: '0 0 8px' }}>Quản Lý Đặt Phòng</h1>
          {user && (
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 15 }}>
              Xin chào, <span style={{ color: GOLD, fontWeight: 700 }}>{user.name}</span>! Dưới đây là tổng quan đặt phòng và hóa đơn của bạn.
            </p>
          )}
        </div>
      </section>

      <section style={{ padding: '0 5vw', maxWidth: 1100, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 32, marginTop: 32, gap: 4 }}>
          {[
            { key: 'bookings', label: 'Đặt Phòng Của Tôi', icon: <CalendarOutlined /> },
            { key: 'invoices', label: 'Hóa Đơn & Thanh Toán', icon: <FileTextOutlined /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
              background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              color: activeTab === tab.key ? GOLD : '#6b7280',
              borderBottom: activeTab === tab.key ? `3px solid ${GOLD}` : '3px solid transparent',
              marginBottom: -2, transition: 'all 0.2s', letterSpacing: '0.3px',
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Đang tải đặt phòng...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🏨</div>
                <h3 style={{ color: DARK, fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Chưa Có Đặt Phòng Nào</h3>
                <p style={{ color: '#6b7280', marginBottom: 28 }}>Hãy đặt phòng ngay để trải nghiệm kỳ nghỉ hoàn hảo tại ThirtySix Resort!</p>
                <a href="/rooms">
                  <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '13px 32px', color: DARK, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    Đặt Phòng Ngay
                  </button>
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
                {bookings.map(b => {
                  const st = statusMap[b.status] || statusMap.Pending;
                  const detail = b.bookingDetails?.[0];
                  const hasInvoice = invoices.some(inv => inv.bookingId === b.id || inv.bookingCode === b.bookingCode);
                  return (
                    <div key={b.id} style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f0ebe0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>MÃ ĐẶT PHÒNG</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: DARK }}>{b.bookingCode}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                            ID: <span style={{ fontWeight: 600, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>#{b.id}</span>
                            <span style={{ marginLeft: 8, color: '#d1d5db' }}>·</span>
                            <span style={{ marginLeft: 8, fontSize: 11 }}>Cung cấp ID này cho admin để tạo hóa đơn</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: st.bg, color: st.color, borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13 }}>
                            {st.icon} {st.label}
                          </div>
                          {hasInvoice ? (
                            <button onClick={() => setActiveTab('invoices')}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ecfdf5', color: '#10b981', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, border: '1px solid #a7f3d0', cursor: 'pointer' }}>
                              <FileTextOutlined /> Có hóa đơn
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef9ee', color: '#f59e0b', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 12, border: '1px solid #fde68a' }}>
                              <ClockCircleOutlined /> Chờ xuất hóa đơn
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, padding: '16px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>LOẠI PHÒNG</div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{detail?.roomTypeName || detail?.roomType?.name || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>NHẬN PHÒNG</div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{formatDate(detail?.checkInDate)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>TRẢ PHÒNG</div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{formatDate(detail?.checkOutDate)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>SỐ ĐÊM</div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{detail?.nights || '—'} đêm</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>GIÁ/ĐÊM</div>
                          <div style={{ fontWeight: 700, color: GOLD, fontSize: 15 }}>{formatCurrency(detail?.pricePerNight)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {b.guestPhone && (
                          <div style={{ fontSize: 13, color: '#6b7280' }}>
                            📞 <strong style={{ color: DARK }}>{b.guestPhone}</strong>
                          </div>
                        )}
                        {b.guestEmail && (
                          <div style={{ fontSize: 13, color: '#6b7280' }}>
                            ✉️ <strong style={{ color: DARK }}>{b.guestEmail}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Đang tải hóa đơn...</div>
            ) : invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
                <h3 style={{ color: DARK, fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Chưa Có Hóa Đơn</h3>
                <p style={{ color: '#6b7280' }}>Hóa đơn sẽ được tạo sau khi xác nhận đặt phòng.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f0ebe0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>HÓA ĐƠN #{inv.id} — {inv.bookingCode}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: DARK }}>{inv.guestName || 'Khách'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                        background: inv.status === 'Paid' ? '#ecfdf5' : '#fef9ee',
                        color: inv.status === 'Paid' ? '#10b981' : '#f59e0b',
                        borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13 }}>
                        {inv.status === 'Paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        {inv.status === 'Paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, padding: '16px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
                      {[
                        { label: 'Tiền Phòng', value: formatCurrency(inv.totalRoomAmount) },
                        { label: 'Dịch Vụ', value: formatCurrency(inv.totalServiceAmount) },
                        { label: 'Giảm Giá', value: `-${formatCurrency(inv.discountAmount)}` },
                        { label: 'Thuế', value: formatCurrency(inv.taxAmount) },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: 14 }}>Tổng Cộng: </span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{formatCurrency(inv.finalTotal)}</span>
                      </div>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => { setSelectedInvoice(inv); setPayModal(true); }} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
                          border: 'none', borderRadius: 10, padding: '12px 24px',
                          color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(201,168,76,0.35)',
                        }}>
                          <CreditCardOutlined /> Thanh Toán Ngay
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== PAY MODAL ===== */}
      <Modal
        open={payModal}
        onCancel={() => { setPayModal(false); setSelectedInvoice(null); }}
        footer={null}
        width={500}
        title={null}
        styles={{ content: { borderRadius: 20, padding: '32px' } }}
      >
        {selectedInvoice && (
          <div>
            <h2 style={{ margin: '0 0 6px', color: DARK, fontWeight: 800, fontSize: 22 }}>Thanh Toán Hóa Đơn</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>HĐ #{selectedInvoice.id} — {selectedInvoice.bookingCode}</p>

            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Tiền phòng</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(selectedInvoice.totalRoomAmount)}</span>
              </div>
              {selectedInvoice.totalServiceAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Dịch vụ</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedInvoice.totalServiceAmount)}</span>
                </div>
              )}
              {selectedInvoice.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Giảm giá</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: DARK }}>TỔNG THANH TOÁN</span>
                <span style={{ fontWeight: 800, color: GOLD, fontSize: 18 }}>{formatCurrency(selectedInvoice.finalTotal)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, letterSpacing: '0.5px' }}>PHƯƠNG THỨC THANH TOÁN</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {payMethods.map(pm => (
                  <div key={pm.key} onClick={() => setPayMethod(pm.key)} style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer',
                    border: payMethod === pm.key ? `2px solid ${GOLD}` : '1.5px solid #e5e7eb',
                    background: payMethod === pm.key ? '#fef9ee' : '#fff',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{pm.icon}</div>
                    <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>{pm.label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{pm.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {payMethod === 'bank' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6, fontSize: 14 }}>Thông tin chuyển khoản:</div>
                <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.8 }}>
                  Ngân hàng: <strong>Vietcombank</strong><br />
                  Số TK: <strong>0123456789</strong><br />
                  Chủ TK: <strong>THIRTYSIX RESORT</strong><br />
                  Nội dung: <strong>{selectedInvoice.bookingCode}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPayModal(false)} style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px', color: '#374151', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={handlePay} disabled={paying} style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '13px', color: DARK, fontWeight: 700, fontSize: 15, cursor: paying ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.35)' }}>
                {paying ? 'Đang xử lý...' : '✓ Xác Nhận Thanh Toán'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
