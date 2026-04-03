import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // Lấy token và user từ localStorage nếu đã đăng nhập trước đó
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,

  // Hàm gọi khi Đăng nhập thành công
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  // Hàm gọi khi bấm Đăng xuất
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));