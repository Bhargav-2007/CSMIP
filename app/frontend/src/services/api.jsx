import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.origin.includes('vercel.app') ? `${window.location.origin}/api` : 'http://localhost:5000');
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
const TOKEN_KEY = 'csmip_token';
const REFRESH_TOKEN_KEY = 'csmip_refresh_token';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { token, refresh_token } = response.data;
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.hash = '#/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  sendOTP: (phone) =>
    apiClient.post('/api/auth/send-otp', { phone }),

  verifyOTP: (phone, otp) =>
    apiClient.post('/api/auth/verify-otp', { phone, otp }),

  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),

  refreshToken: () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return apiClient.post('/api/auth/refresh', { refresh_token: refreshToken });
  },

  logout: () =>
    apiClient.post('/api/auth/logout')
};

// Services endpoints
export const servicesAPI = {
  listServices: (params) =>
    apiClient.get('/api/services', { params }),

  getServiceBySlug: (slug) =>
    apiClient.get(`/api/services/${slug}`),

  getAlerts: () =>
    apiClient.get('/api/services/alerts'),

  getSchemes: (params) =>
    apiClient.get('/api/services/schemes', { params })
};

// Applications endpoints
export const applicationsAPI = {
  createApplication: (data) =>
    apiClient.post('/api/applications', data),

  listApplications: (params) =>
    apiClient.get('/api/applications', { params }),

  getApplicationByRefNo: (refNo) =>
    apiClient.get(`/api/applications/${refNo}`),

  updateApplication: (refNo, data) =>
    apiClient.put(`/api/applications/${refNo}`, data),

  submitApplication: (refNo) =>
    apiClient.post(`/api/applications/${refNo}/submit`),

  deleteApplication: (refNo) =>
    apiClient.delete(`/api/applications/${refNo}`)
};

// Complaints endpoints
export const complaintsAPI = {
  createComplaint: (data) =>
    apiClient.post('/api/complaints', data),

  listComplaints: (params) =>
    apiClient.get('/api/complaints', { params }),

  getComplaintByRefNo: (refNo) =>
    apiClient.get(`/api/complaints/${refNo}`),

  updateComplaint: (refNo, data) =>
    apiClient.put(`/api/complaints/${refNo}`, data),

  deleteComplaint: (refNo) =>
    apiClient.delete(`/api/complaints/${refNo}`)
};

// RTI endpoints
export const rtiAPI = {
  createRTI: (data) =>
    apiClient.post('/api/rti', data),

  listRTI: (params) =>
    apiClient.get('/api/rti', { params }),

  getRTIByRefNo: (refNo) =>
    apiClient.get(`/api/rti/${refNo}`)
};

// Payments endpoints
export const paymentsAPI = {
  listPayments: (params) =>
    apiClient.get('/api/payments', { params }),

  initiatePayment: (applicationId) =>
    apiClient.post('/api/payments/initiate', { applicationId }),

  mockPayment: (paymentId, status) =>
    apiClient.post('/api/payments/mock', { paymentId, status })
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () =>
    apiClient.get('/api/dashboard/stats'),

  getRecentItems: () =>
    apiClient.get('/api/dashboard/recent')
};

// User endpoints
export const userAPI = {
  getProfile: () =>
    apiClient.get('/api/user/profile'),

  updateProfile: (data) =>
    apiClient.put('/api/user/profile', data)
};

// Admin endpoints
export const adminAPI = {
  getStats: () =>
    apiClient.get('/api/admin/stats'),

  listApplications: (params) =>
    apiClient.get('/api/admin/applications', { params }),

  updateApplicationStatus: (refNo, data) =>
    apiClient.put(`/api/admin/applications/${refNo}`, data),

  listComplaints: (params) =>
    apiClient.get('/api/admin/complaints', { params }),

  assignComplaint: (refNo, assignedTo) =>
    apiClient.put(`/api/admin/complaints/${refNo}/assign`, { assignedTo }),

  listRTI: (params) =>
    apiClient.get('/api/admin/rti', { params }),

  respondToRTI: (refNo, data) =>
    apiClient.put(`/api/admin/rti/${refNo}/respond`, data),

  exportData: (kind) =>
    apiClient.get(`/api/admin/export/${kind}`)
};

// Utility function to format error messages
export const formatAPIError = (error) => {
  if (error.response?.data?.error) {
    return {
      code: error.response.data.error.code,
      message: error.response.data.error.message
    };
  }

  if (error.message === 'Network Error') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to server. Please check your internet connection.'
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred'
  };
};

export default apiClient;
