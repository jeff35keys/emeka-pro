import axios from 'axios';

const rawApiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message = `Cannot reach backend API at ${API_BASE_URL}. Make sure the backend is running on port 5000 and restart the React dev server.`;
    }

    return Promise.reject(error);
  }
);

// Add token and user context to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user?.id || user?._id) {
        config.headers['x-user-id'] = user.id || user._id;
      }
      if (user?.role) {
        config.headers['x-user-role'] = user.role;
      }
    } catch (error) {
      console.warn('Unable to read saved user context for API request', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token on expiry
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // If unauthorized due to expired token, try refresh once
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(error);

      try {
        const refreshResp = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const newToken = refreshResp.data?.data?.token || refreshResp.data?.token;
        const newRefresh = refreshResp.data?.data?.refreshToken || refreshResp.data?.refreshToken;
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data)
};

// Doctor Services
export const doctorService = {
  getAllDoctors: (params = {}) => apiClient.get('/doctors', { params }),
  getDoctorById: (id) => apiClient.get(`/doctors/${id}`),
  searchDoctors: (params) => apiClient.get('/doctors/search', { params }),
  getDoctorProfile: () => apiClient.get('/doctors/profile'),
  updateDoctorProfile: (data) => apiClient.put('/doctors/profile', data),
  getDoctorSchedule: (id) => apiClient.get(`/doctors/schedule/${id}`),
  getDoctorStats: () => apiClient.get('/doctors/stats'),
  updateAvailability: (data) => apiClient.put('/doctors/availability', data),
  getDoctorAppointments: (params = {}) => apiClient.get('/doctors/appointments/list', { params })
};

// Patient Services
export const patientService = {
  getAllPatients: () => apiClient.get('/patients/all'),
  getPatientProfile: (id = '') => apiClient.get(`/patients/profile/${id}`),
  updatePatientProfile: (data) => apiClient.put('/patients/profile', data),
  getPatientAppointments: () => apiClient.get('/patients/appointments'),
  getPatientPayments: () => apiClient.get('/patients/payments')
};

// Appointment Services
export const appointmentService = {
  getMyAppointments: () => apiClient.get('/appointments'),
  createAppointment: (data) => apiClient.post('/appointments/create', data),
  getAvailableSlots: (doctorId, date) => 
    apiClient.get('/appointments/available-slots', { params: { doctorId, date } }),
  getAppointmentDetails: (id) => apiClient.get(`/appointments/${id}`),
  cancelAppointment: (id) => apiClient.put(`/appointments/${id}/cancel`),
  rescheduleAppointment: (id, data) => apiClient.put(`/appointments/${id}/reschedule`, data),
  completeAppointment: (id, data) => apiClient.put(`/appointments/${id}/complete`, data)
};

// Payment Services
export const paymentService = {
  createStripeCheckout: (data) => apiClient.post('/payments/stripe-checkout', data),
  confirmStripeCheckout: (data) => apiClient.post('/payments/stripe-confirm', data),
  createPayment: (data) => apiClient.post('/payments/create', data),
  recordCashPayment: (data) => apiClient.post('/payments/cash', data),
  recordBankTransfer: (data) => apiClient.post('/payments/bank-transfer', data),
  verifyBankTransfer: (paymentId, data) => apiClient.put(`/payments/${paymentId}/verify-transfer`, data),
  getPaymentHistory: (params = {}) => apiClient.get('/payments/history', { params }),
  getPaymentAnalytics: () => apiClient.get('/payments/analytics')
};

// Admin Services
export const adminService = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAllUsers: () => apiClient.get('/admin/users'),
  deactivateUser: (userId) => apiClient.put(`/admin/users/${userId}/deactivate`),
  getAllAppointments: () => apiClient.get('/admin/appointments'),
  getRevenueReport: () => apiClient.get('/admin/reports/revenue')
};

export default apiClient;
