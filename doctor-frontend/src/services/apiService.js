import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      error.message = `Cannot reach backend API at ${API_BASE_URL}. Make sure the backend is running on port 5000.`;
    }

    return Promise.reject(error);
  }
);

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const message = error.response?.data?.message || '';

    if (status === 401 && message.toLowerCase().includes('invalid or expired token') && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(error);

      try {
        const refreshResp = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        if (refreshResp.data?.success && (refreshResp.data.data?.token || refreshResp.data.token)) {
          const newToken = refreshResp.data.data?.token || refreshResp.data.token;
          const newRefresh = refreshResp.data.data?.refreshToken || refreshResp.data.refreshToken;
          localStorage.setItem('token', newToken);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Services (for doctor)
export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data)
};

// Doctor Services
export const doctorService = {
  getDoctorProfile: () => apiClient.get('/doctors/profile'),
  updateDoctorProfile: (data) => apiClient.put('/doctors/profile', data),
  getDoctorSchedule: (id) => apiClient.get(`/doctors/schedule/${id}`),
  getDoctorStats: () => apiClient.get('/doctors/stats'),
  updateAvailability: (data) => apiClient.put('/doctors/availability', data),
  getDoctorAppointments: (params = {}) => apiClient.get('/doctors/appointments/list', { params })
  ,
  // Public doctor list endpoints (used by doctor-frontend to display doctor grid)
  getAllDoctors: (params = {}) => apiClient.get('/doctors', { params }),
  getDoctorById: (id) => apiClient.get(`/doctors/${id}`)
};

// Appointment Services
export const appointmentService = {
  getMyAppointments: () => apiClient.get('/appointments'),
  getAppointmentDetails: (id) => apiClient.get(`/appointments/${id}`),
  cancelAppointment: (id) => apiClient.put(`/appointments/${id}/cancel`),
  rescheduleAppointment: (id, data) => apiClient.put(`/appointments/${id}/reschedule`, data),
  handleRescheduleApproval: (id, data) => apiClient.put(`/appointments/${id}/reschedule-approval`, data),
  completeAppointment: (id, data) => apiClient.put(`/appointments/${id}/complete`, data)
};

// Payment Services
export const paymentService = {
  recordBankTransfer: (data) => apiClient.post('/payments/bank-transfer', data),
  verifyBankTransfer: (paymentId, data) => apiClient.put(`/payments/${paymentId}/verify-transfer`, data)
};

// Generic API client export for ad hoc requests
export const apiService = apiClient;
