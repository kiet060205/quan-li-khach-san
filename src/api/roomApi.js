import axiosClient from './axiosClient';

export const roomApi = {
  // ==========================================
  // 1. NHÓM API QUẢN LÝ PHÒNG (ROOMS)
  // ==========================================
  getAllRooms: () => {
    return axiosClient.get('/Rooms'); 
  },

  createRoom: (data) => {
    return axiosClient.post('/Rooms', data);
  },

  updateRoom: (id, data) => {
    return axiosClient.put(`/Rooms/${id}`, data);
  },

  deleteRoom: (id) => {
    return axiosClient.delete(`/Rooms/${id}`);
  },

  // API dành riêng cho Housekeeping (Đổi trạng thái nhanh)
  updateRoomStatus: (id, newStatus) => {
    return axiosClient.patch(`/Rooms/${id}/status`, `"${newStatus}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  bulkCreate: (roomsArray) => {
    return axiosClient.post('/Rooms/bulk-create', roomsArray);
  },

  // ==========================================
  // 2. NHÓM API QUẢN LÝ HẠNG PHÒNG & ẢNH (ROOM TYPES)
  // ==========================================
  getRoomTypes: () => {
    return axiosClient.get('/RoomTypes'); 
  },

  // Upload ảnh (Bắt buộc dùng multipart/form-data)
  uploadImage: (roomTypeId, formData) => {
    return axiosClient.post(`/RoomTypes/${roomTypeId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Xóa ảnh
  deleteImage: (imageId) => {
    return axiosClient.delete(`/RoomTypes/images/${imageId}`);
  },

  // Set ảnh làm đại diện
  setPrimaryImage: (roomTypeId, imageId) => {
    return axiosClient.patch(`/RoomTypes/${roomTypeId}/images/${imageId}/set-primary`);
  }
};