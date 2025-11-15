// frontend/src/services/api.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users')
};

// Query APIs
export const queryAPI = {
  getAll: (params) => api.get('/queries', { params }),
  getById: (id) => api.get(`/queries/${id}`),
  create: (data) => api.post('/queries', data),
  assignQuery: (id, userId) => api.put(`/queries/${id}/assign`, { userId }),
  updateStatus: (id, status) => api.put(`/queries/${id}/status`, { status }),
  escalate: (id) => api.put(`/queries/${id}/escalate`),
  addNote: (id, text) => api.post(`/queries/${id}/notes`, { text })
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getTeamPerformance: () => api.get('/analytics/team-performance')
};

export default api;