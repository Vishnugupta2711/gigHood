import axios from 'axios';

const DEFAULT_LOCAL_API_URL = 'http://localhost:8001';
const DEFAULT_PROD_API_URL = 'https://gighood-backend-live.onrender.com';
const DEFAULT_PREVIEW_API_URL = 'https://gighood-backend-admin.onrender.com';

function resolveApiBaseUrl(): string {
  const configuredProd = process.env.NEXT_PUBLIC_API_URL;
  const configuredPreview = process.env.NEXT_PUBLIC_API_URL_PREVIEW;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return DEFAULT_LOCAL_API_URL;
    }

    // Allow preview deployments to use an isolated backend URL without touching production config.
    const isVercelPreview =
      host.endsWith('.vercel.app') &&
      !host.includes('gighood.vercel.app');

    if (isVercelPreview) {
      return configuredPreview || DEFAULT_PREVIEW_API_URL;
    }
  }

  if (configuredProd) return configuredProd;

  return DEFAULT_PROD_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

type ApiError = Error & { status?: number };

function withStatus(error: Error, status: number): ApiError {
  const next = error as ApiError;
  next.status = status;
  return next;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: process.env.NODE_ENV === 'development' ? 12000 : 30000,
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
  (error: unknown) => {
    const maybeError = error as {
      response?: { data?: { detail?: string }; status?: number };
      message?: string;
    };

    if (!maybeError?.response) {
      const networkErr = new Error(
        `Network error: cannot reach API (${API_BASE_URL}). Check NEXT_PUBLIC_API_URL and backend availability.`
      );
      return Promise.reject(withStatus(networkErr, 0));
    }

    const msg =
      maybeError.response.data?.detail ||
      maybeError.message ||
      'Unknown error';
    const err = new Error(msg);
    return Promise.reject(withStatus(err, maybeError.response.status ?? 0));
  }
);

export default api;
