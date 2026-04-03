import axiosClient from './axiosClient';

export const roomApi = {
  // Đã xóa chữ /api ở đầu
  getAllRooms: () => {
    return axiosClient.get('/Rooms'); 
  },

  createRoom: (data) => {
    return axiosClient.post('/Rooms', data);
  },

  updateStatus: (id, newStatus) => {
    return axiosClient.patch(`/Rooms/${id}/status`, `"${newStatus}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  bulkCreate: (roomsArray) => {
    return axiosClient.post('/Rooms/bulk-create', roomsArray);
  },
  // THÊM HÀM NÀY VÀO ĐỂ LẤY HẠNG PHÒNG:
  getRoomTypes: () => {
    return axiosClient.get('/RoomTypes'); // Gọi đúng tên Controller bro vừa tạo
  },
};