import axios from 'axios';

// Dynamically use environment variable or default to live Render backend
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'hhttps://kamareyecare.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle Token Refresh & Retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip handling if it's not a 401 or if the request was already retried
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on login/token endpoints
    if (originalRequest.url.includes('/token/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue concurrent requests while token is refreshing
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      isRefreshing = false;
      handleLogout();
      return Promise.reject(error);
    }

    try {
      // Updated token refresh call to use the dynamic BASE_URL
      const response = await axios.post(`${BASE_URL}/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem('accessToken', access);

      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      originalRequest.headers['Authorization'] = `Bearer ${access}`;

      processQueue(null, access);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    // Preserve current URL in query string so route guard can return after login
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

export default api;