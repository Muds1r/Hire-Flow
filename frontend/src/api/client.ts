import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Same base as axios `api` — for `fetch(..., { keepalive: true })` on unload. */
export const API_BASE_URL = baseURL.replace(/\/$/, '');

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
