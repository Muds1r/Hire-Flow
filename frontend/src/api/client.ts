import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/** Relative `/api` uses Vite dev proxy; override with VITE_API_URL in production. */
const baseURL = import.meta.env.VITE_API_URL ?? '/api';

/** Same base as axios `api` — for `fetch(..., { credentials: 'include' })` on unload. */
export const API_BASE_URL = baseURL.replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setReady(true);
    }
    return Promise.reject(error);
  },
);
