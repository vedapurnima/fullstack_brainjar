import axios from 'axios';

const API_URL = 'http://localhost:8080'; // Backend port

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're not already on the login page
    // and it's not a login/register request
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRequest = error.config?.url?.includes('/auth/');
      
      if (!isAuthRequest && currentPath !== '/login' && currentPath !== '/register') {
        console.log('Unauthorized access, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create a unified API object with REST methods
const api = {
  get: (url) => apiInstance.get(url),
  post: (url, data) => apiInstance.post(url, data),
  put: (url, data) => apiInstance.put(url, data),
  patch: (url, data) => apiInstance.patch(url, data),
  delete: (url) => apiInstance.delete(url),
};

export default api;
