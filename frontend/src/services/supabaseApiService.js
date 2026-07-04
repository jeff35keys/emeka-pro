import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth Service ============
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  }
};

// ============ Doctor Service ============
export const doctorService = {
  getAllDoctors: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.maxFee) params.append('maxFee', filters.maxFee);
    if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}`);
    return response.data;
  },

  searchDoctors: async (searchParams) => {
    const params = new URLSearchParams();
    if (searchParams.specialization) params.append('specialization', searchParams.specialization);
    if (searchParams.name) params.append('name', searchParams.name);
    if (searchParams.fee) params.append('fee', searchParams.fee);
    if (searchParams.rating) params.append('rating', searchParams.rating);

    const response = await api.get('/doctors/search', { params });
    return response.data;
  },

  updateDoctorProfile: async (profileData) => {
    const response = await api.put('/doctors/profile', profileData);
    return response.data;
  },

  updateAvailability: async (availability) => {
    const response = await api.put('/doctors/availability', { availability });
    return response.data;
  },

  getDoctorAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);

    const response = await api.get('/doctors/schedule', { params });
    return response.data;
  },

  getDoctorStats: async () => {
    const response = await api.get('/doctors/stats');
    return response.data;
  }
};

// ============ Patient Service ============
export const patientService = {
  getPatientProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updatePatientProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  getPatientAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);

    const response = await api.get('/appointments/history', { params });
    return response.data;
  },

  getPatientPayments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.method) params.append('method', filters.method);

    const response = await api.get('/payments/history', { params });
    return response.data;
  }
};

// ============ Appointment Service ============
export const appointmentService = {
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments/create', appointmentData);
    return response.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get('/appointments/available-slots', {
      params: { doctorId, date }
    });
    return response.data;
  },

  getAppointmentDetails: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  cancelAppointment: async (appointmentId) => {
    const response = await api.put(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },

  rescheduleAppointment: async (appointmentId, newDate, newTime) => {
    const response = await api.put(`/appointments/${appointmentId}/reschedule`, {
      newDate,
      newTime
    });
    return response.data;
  },

  completeAppointment: async (appointmentId, notes) => {
    const response = await api.put(`/appointments/${appointmentId}/complete`, { notes });
    return response.data;
  }
};

// ============ Payment Service ============
export const paymentService = {
  recordCashPayment: async (paymentData) => {
    const response = await api.post('/payments/cash', paymentData);
    return response.data;
  },

  recordBankTransfer: async (paymentData) => {
    const response = await api.post('/payments/bank-transfer', paymentData);
    return response.data;
  },

  getPaymentHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.method) params.append('method', filters.method);

    const response = await api.get('/payments/history', { params });
    return response.data;
  },

  verifyBankTransfer: async (paymentId, verificationStatus) => {
    const response = await api.put(`/payments/${paymentId}/verify-transfer`, {
      verificationStatus
    });
    return response.data;
  },

  getPaymentAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get('/payments/analytics', { params });
    return response.data;
  }
};

// ============ Admin Service ============
export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  getAllAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);

    const response = await api.get('/admin/appointments', { params });
    return response.data;
  },

  getRevenueReport: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    const response = await api.get('/admin/reports/revenue', { params });
    return response.data;
  }
};

export default api;
