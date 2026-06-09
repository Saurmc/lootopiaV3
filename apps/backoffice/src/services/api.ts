import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const BASE_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env
  .VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, clearAuth, setAuth, user } = useAuthStore.getState();
      if (refreshToken && user) {
        try {
          const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
            `${BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
          );
          setAuth(data.access_token, data.refresh_token, user);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    }
    return Promise.reject(error);
  },
);
