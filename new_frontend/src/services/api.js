import axios from 'axios';

/**
 * En `npm run dev`, llamar directo a FastAPI evita 502: el proxy HTTP de Vite corta
 * conexiones largas (lotes de imágenes + TensorFlow). En build, se usa /api o VITE_API_BASE.
 */
function getApiBaseURL() {
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://127.0.0.1:8000';
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
  (error) => {
    if (error.response && error.response.status === 401 && !error.config.url.includes('/token')) {
      // Token expirado o inválido: Limpiar y redirigir
      localStorage.removeItem('token');
      window.location.reload(); // Esto forzará al App.jsx a mostrar el Login
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
    return response.data;
  },
  logout: async () => {
    return await api.post('/logout');
  }
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

  analyzeDenseNet: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/analyze-densenet/', formData);
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
