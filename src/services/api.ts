import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials sends httpOnly cookies automatically — no localStorage needed
  withCredentials: true,
});

// No request interceptor needed: the browser sends the httpOnly cookie automatically
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Refresh call sends httpOnly refreshToken cookie automatically
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return axiosInstance(originalRequest);
      } catch {
        // Refresh failed — redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1;
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
