import axiosClient from './axiosClient';

export const articleApi = {
  getAllArticles: () => axiosClient.get('/Articles'),
  getArticleById: (id) => axiosClient.get(`/Articles/${id}`),
  createArticle: (data) => axiosClient.post('/Articles', data),
  updateArticle: (id, data) => axiosClient.put(`/Articles/${id}`, data),
  deleteArticle: (id) => axiosClient.delete(`/Articles/${id}`)
};

export const attractionApi = {
  getAllAttractions: () => axiosClient.get('/Attractions'),
  getAttractionById: (id) => axiosClient.get(`/Attractions/${id}`),
  createAttraction: (data) => axiosClient.post('/Attractions', data),
  updateAttraction: (id, data) => axiosClient.put(`/Attractions/${id}`, data),
  deleteAttraction: (id) => axiosClient.delete(`/Attractions/${id}`)
};

export const voucherApi = {
  getAllVouchers: () => axiosClient.get('/Vouchers'),
  getVoucherById: (id) => axiosClient.get(`/Vouchers/${id}`),
  createVoucher: (data) => axiosClient.post('/Vouchers', data),
  updateVoucher: (id, data) => axiosClient.put(`/Vouchers/${id}`, data),
  deleteVoucher: (id) => axiosClient.delete(`/Vouchers/${id}`)
};

export const reviewApi = {
  getAllReviews: () => axiosClient.get('/Reviews'),
  getReviewById: (id) => axiosClient.get(`/Reviews/${id}`),
  createReview: (data) => axiosClient.post('/Reviews', data),
  updateReview: (id, data) => axiosClient.put(`/Reviews/${id}`, data),
  deleteReview: (id) => axiosClient.delete(`/Reviews/${id}`)
};
