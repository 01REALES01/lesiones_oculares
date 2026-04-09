import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
};

export const analysisService = {
  analyzeComparison: async (files, modelsStr) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(`/analyze-rd-comparison/?models=${modelsStr}`,
      formData, 
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  analyzeDenseNet: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/analyze-densenet/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getHistory: async (limit = 20) => {
    const response = await api.get(`/history?limit=${limit}`);
    return response.data.inferences || [];
  },

  getInference: async (id) => {
    const response = await api.get(`/inferences/${id}`);
    return response.data;
  }
};

export default api;
