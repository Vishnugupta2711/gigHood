import axios from 'axios';

// Backend running at port 8001 — same machine on same WiFi
// When serving from phone on same network, use machine IP instead of localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gighood_jwt');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors to a single message string, but preserve status code
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const msg =
      error?.response?.data?.detail ||
      error?.message ||
      'Unknown error';
    const err = new Error(msg);
    (err as any).status = error?.response?.status;
    return Promise.reject(err);
  }
);

export default api;
