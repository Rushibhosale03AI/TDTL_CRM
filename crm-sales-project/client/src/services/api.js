import axios from 'axios';

// API Base URL
// API Base URL
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '').replace('//localhost:', '//127.0.0.1:');

// Create Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh and auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ────────────────────────────────────────
// AUTH ENDPOINTS
// ────────────────────────────────────────

export const authAPI = {
  register: (userData) =>
    api.post('auth/register/', userData),
  
  login: (email, password) =>
    api.post('auth/login/', { email, password }),
  
  refreshToken: (refreshToken) =>
    api.post('auth/token/refresh/', { refresh: refreshToken }),
  
  getUserProfile: () =>
    api.get('auth/me/'),
  
  updateProfile: (userData) =>
    api.patch('auth/me/', userData),
};

export const userAPI = {
  list: (params = {}) =>
    api.get('auth/users/', { params }),
  
  retrieve: (id) =>
    api.get(`auth/users/${id}/`),
};

// ────────────────────────────────────────
// LEADS ENDPOINTS
// ────────────────────────────────────────

export const leadsAPI = {
  list: (params = {}) =>
    api.get('leads/', { params }),
  
  retrieve: (id) =>
    api.get(`leads/${id}/`),
  
  create: (data) =>
    api.post('leads/', data),
  
  update: (id, data) =>
    api.put(`leads/${id}/`, data),
  
  partialUpdate: (id, data) =>
    api.patch(`leads/${id}/`, data),
  
  delete: (id) =>
    api.delete(`leads/${id}/`),
  
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('leads/import_excel/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  exportExcel: (params = {}) =>
    api.get('leads/export_excel/', {
      params,
      responseType: 'blob',
    }),

  downloadTemplate: () =>
    api.get('leads/download_template/', {
      responseType: 'blob',
    }),
};

// ────────────────────────────────────────
// CONTACTS ENDPOINTS
// ────────────────────────────────────────

export const contactsAPI = {
  list: (params = {}) =>
    api.get('contacts/', { params }),
  
  retrieve: (id) =>
    api.get(`contacts/${id}/`),
  
  create: (data) =>
    api.post('contacts/', data),
  
  update: (id, data) =>
    api.put(`contacts/${id}/`, data),
  
  partialUpdate: (id, data) =>
    api.patch(`contacts/${id}/`, data),
  
  delete: (id) =>
    api.delete(`contacts/${id}/`),
};

// ────────────────────────────────────────
// DEALS ENDPOINTS
// ────────────────────────────────────────

export const dealsAPI = {
  list: (params = {}) =>
    api.get('deals/', { params }),
  
  retrieve: (id) =>
    api.get(`deals/${id}/`),
  
  create: (data) =>
    api.post('deals/', data),
  
  update: (id, data) =>
    api.put(`deals/${id}/`, data),
  
  partialUpdate: (id, data) =>
    api.patch(`deals/${id}/`, data),
  
  delete: (id) =>
    api.delete(`deals/${id}/`),
};

// ────────────────────────────────────────
// TASKS ENDPOINTS
// ────────────────────────────────────────

export const tasksAPI = {
  list: (params = {}) =>
    api.get('tasks/', { params }),
  
  retrieve: (id) =>
    api.get(`tasks/${id}/`),
  
  create: (data) =>
    api.post('tasks/', data),
  
  update: (id, data) =>
    api.put(`tasks/${id}/`, data),
  
  partialUpdate: (id, data) =>
    api.patch(`tasks/${id}/`, data),
  
  delete: (id) =>
    api.delete(`tasks/${id}/`),
};

// ────────────────────────────────────────
// ACTIVITIES ENDPOINTS
// ────────────────────────────────────────

export const activitiesAPI = {
  list: (params = {}) =>
    api.get('activities/', { params }),
  
  retrieve: (id) =>
    api.get(`activities/${id}/`),
  
  create: (data) =>
    api.post('activities/', data),
  
  update: (id, data) =>
    api.put(`activities/${id}/`, data),
  
  partialUpdate: (id, data) =>
    api.patch(`activities/${id}/`, data),
  
  delete: (id) =>
    api.delete(`activities/${id}/`),
};

// ────────────────────────────────────────
// IMPORTS ENDPOINTS
// ────────────────────────────────────────

export const importsAPI = {
  list: (params = {}) =>
    api.get('imports/', { params }),
  
  retrieve: (id) =>
    api.get(`imports/${id}/`),
};

// ────────────────────────────────────────
// DASHBOARD ENDPOINTS
// ────────────────────────────────────────

export const dashboardAPI = {
  adminSummary: () =>
    api.get('dashboard/admin/'),
  
  managerSummary: () =>
    api.get('dashboard/manager/'),
  
  salesSummary: () =>
    api.get('dashboard/sales/'),
};

// ────────────────────────────────────────
// APPROVALS ENDPOINTS
// ────────────────────────────────────────

export const approvalsAPI = {
  list: (params = {}) =>
    api.get('auth/approvals/', { params }),
  
  approve: (id) =>
    api.post(`auth/approvals/${id}/approve/`),
  
  reject: (id) =>
    api.post(`auth/approvals/${id}/reject/`),
};

// ────────────────────────────────────────
// TEAMS ENDPOINTS
// ────────────────────────────────────────

export const teamsAPI = {
  list: (params = {}) =>
    api.get('teams/', { params }),
  
  retrieve: (id) =>
    api.get(`teams/${id}/`),
  
  create: (data) =>
    api.post('teams/', data),
  
  delete: (id) =>
    api.delete(`teams/${id}/`),
};

// ────────────────────────────────────────
// NEW ENTERPRISE CRM ENDPOINTS
// ────────────────────────────────────────

export const activityLogsAPI = {
  list: (params = {}) => api.get('activity-logs/', { params }),
};

export const notificationsAPI = {
  list: (params = {}) => api.get('notifications/', { params }),
  markAllRead: () => api.post('notifications/mark-all-read/'),
};

export const documentsAPI = {
  list: (params = {}) => api.get('documents/', { params }),
  upload: (leadId, file) => {
    const formData = new FormData();
    formData.append('lead', leadId);
    formData.append('file', file);
    return api.post('documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`documents/${id}/`),
};

export const eodAPI = {
  create: (data) => api.post('eod/create/', data),
  myReports: () => api.get('eod/my-reports/'),
  update: (id, data) => api.put(`eod/update/${id}/`, data),
  teamReports: () => api.get('eod/team-reports/'),
  approve: (id, remarks) => api.put(`eod/approve/${id}/`, { manager_remarks: remarks }),
  reject: (id, remarks) => api.put(`eod/reject/${id}/`, { manager_remarks: remarks }),
  allReports: () => api.get('eod/all-reports/'),
  analytics: () => api.get('eod/analytics/'),
  export: (params = {}) => api.get('eod/export/', { params, responseType: 'blob' }),
  delete: (id) => api.delete(`eod/delete/${id}/`),
};

export const aiAPI = {
  leadSummary: (id) => api.post(`ai/${id}/lead-summary/`),
  salesPrediction: (id) => api.post(`ai/${id}/sales-prediction/`),
  chat: (message) => api.post('ai/chat/', { message }),
  generateEmail: (leadId, templateType) => api.post('ai/email-generator/', { leadId, templateType }),
};

export const reportsAPI = {
  generate: (type) => api.get('reports/generate/', { params: { type } }),
};

export default api;
