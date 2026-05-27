import axios from 'axios';

/**
 * En `npm run dev`, llamar directo a FastAPI evita 502: el proxy HTTP de Vite corta
 * conexiones largas (lotes de imágenes + TensorFlow). En build, se usa /api o VITE_API_BASE.
 */
function getApiBaseURL() {
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:8000';
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 1_800_000, // 30 min: lotes (varias imágenes × modelos)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor: token + FormData sin Content-Type fijo (axios debe poner boundary en multipart)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor de respuesta: Manejo de errores globales (ej: 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isUnauthorized = error.response && error.response.status === 401;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/token') ||
      originalRequest?.url?.includes('/refresh-token') ||
      originalRequest?.url?.includes('/logout');

    if (isUnauthorized && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${getApiBaseURL()}/refresh-token`,
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const newAccessToken = refreshResponse.data.access_token;

          localStorage.setItem('token', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          console.error('No se pudo renovar el token:', refreshError);
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.setItem('session_expired', 'true');
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.refresh_token) {
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }

    return response.data;
  },

  me: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  logout: async () => {
    try {
      return await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  forgotPassword: async (email) => {
  const response = await api.post('/forgot-password', { email });
  return response.data;
  }
};

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data.users || [];
  },

  createUser: async ({ email, name, password, role = 'user' }) => {
    const response = await api.post('/admin/create-user', {
      email,
      name,
      password,
      role,
    });
    return response.data;
  },

  updateUser: async (email, updates) => {
    const response = await api.put(`/admin/users/${encodeURIComponent(email)}`, updates);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getSuggestions: async () => {
    const response = await api.get('/admin/suggestions');
    return response.data;
  },

  updateSuggestionStatus: async (id, estado) => {
    const response = await api.put(`/admin/suggestions/${id}`, {
      estado,
    });
    return response.data;
  },

  deleteSuggestion: async (id) => {
    const response = await api.delete(`/admin/suggestions/${id}`);
    return response.data;
  },
};

export const suggestionService = {
  create: async ({ mensaje, tipo }) => {
    const response = await api.post('/suggestions', {
      mensaje,
      tipo,
    });
    return response.data;
  },
};

export const analysisService = {
  analyzeComparison: async (files, modelsStr, signal) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(
      `/analyze-rd-comparison/?models=${encodeURIComponent(modelsStr)}`,
      formData,
      { signal }
    );
    return response.data;
  },

  analyzeDemo: async (file, model = 'densenet169') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/analyze-demo/?model=${encodeURIComponent(model)}`, formData);
    return response.data;
  },

  getHistory: async (limit = 20, offset = 0) => {
    const response = await api.get(`/history?limit=${limit}&offset=${offset}`);
    return response.data.inferences || [];
  },

  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/history');
    return response.data;
  },

  getInference: async (id) => {
    const response = await api.get(`/inferences/${id}`);
    return response.data;
  },

  getBatch: async (batchId) => {
    const response = await api.get(`/batches/${batchId}`);
    return response.data;
  },

  exportBatchExcel: async (batchId) => {
    const response = await api.get(`/export/batch/${batchId}/excel`, { 
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAnalysis: async (id) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },
  
  deleteBatch: async (batchId) => {
    const response = await api.delete(`/batches/${batchId}`);
    return response.data;
  }
};

export default api;
