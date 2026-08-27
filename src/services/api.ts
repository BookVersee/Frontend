import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getStoredToken, removeStoredToken } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: API_TIMEOUT,
});

// Request Interceptor: Tự động đính kèm JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Xử lý tập trung các mã lỗi HTTP phổ biến
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          if (error.config?.headers?.Authorization && !error.config.url?.includes("/auth/")) {
            console.warn("[HTTP 401] Token expired. Clearing stored token.");
            removeStoredToken();
          }
          break;
        case 403:
          console.error("[HTTP 403] Forbidden: Bạn không có quyền truy cập chức năng này.");
          break;
        case 404:
          console.warn("[HTTP 404] Resource not found:", error.config?.url);
          break;
        case 422:
        case 400:
          console.error("[HTTP 400/422] Validation Error:", data?.message || data?.errors);
          break;
        case 500:
        case 502:
        case 503:
          console.error("[HTTP 5xx] Lỗi máy chủ Backend.");
          break;
      }
    }
    return Promise.reject(error);
  }
);
