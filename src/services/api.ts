import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from "axios";
import {
  getStoredToken,
  setStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  setStoredUser,
  removeStoredToken,
} from "../utils/storage";

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

// Tầng In-Flight Deduplication cho các request GET đồng thời:
// Tránh gửi nhiều request giống hệt nhau lên Backend khi React mount kép (StrictMode) hoặc nhiều component cùng gọi.
const inFlightGetRequests = new Map<string, Promise<any>>();

const originalGet = apiClient.get.bind(apiClient);

apiClient.get = function <T = any, R = axios.AxiosResponse<T>, D = any>(
  url: string,
  config?: axios.AxiosRequestConfig<D>
): Promise<R> {
  // Cho phép bypass nếu cần ép buộc tải lại
  if (config?.headers && (config.headers as any)["x-skip-dedupe"]) {
    return originalGet<T, R, D>(url, config);
  }

  const paramKey = config?.params ? JSON.stringify(config.params) : "";
  const cacheKey = `GET:${url}:${paramKey}`;

  if (inFlightGetRequests.has(cacheKey)) {
    return inFlightGetRequests.get(cacheKey) as Promise<R>;
  }

  const promise = originalGet<T, R, D>(url, config).finally(() => {
    inFlightGetRequests.delete(cacheKey);
  });

  inFlightGetRequests.set(cacheKey, promise);
  return promise;
};

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

// Hàng đợi lưu các request bị tạm hoãn chờ cấp AccessToken mới (Chống Race Condition)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Xử lý tập trung các mã lỗi HTTP và Silent Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const { status, data } = error.response;
      const requestUrl = originalRequest?.url || "";

      // Kiểm tra xem request có phải endpoint xác thực công khai hay không
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/RefreshToken") ||
        requestUrl.includes("/auth/GoogleLogin") ||
        (originalRequest?.headers && (originalRequest.headers as any)["x-skip-auth-refresh"]);

      switch (status) {
        case 401:
          // Xử lý tự động Refresh Token khi gặp lỗi 401
          if (!isAuthEndpoint && originalRequest && !originalRequest._retry) {
            const refreshToken = getStoredRefreshToken();

            if (!refreshToken) {
              console.warn("[HTTP 401] Không có refresh token trong storage. Hủy phiên.");
              removeStoredToken();
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
              return Promise.reject(error);
            }

            // Nếu đang có request refresh đang chạy dở, đẩy request này vào hàng đợi chờ
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then((newToken) => {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              // Gọi trực tiếp qua axios độc lập để tránh vòng lặp interceptor
              const refreshResponse = await axios.post(`${API_BASE_URL}/auth/RefreshToken`, {
                refreshToken,
              });

              const tokenData = refreshResponse.data?.data;
              const newAccessToken = tokenData?.accessToken || tokenData?.token;
              const newRefreshToken = tokenData?.refreshToken;

              if (!newAccessToken) {
                throw new Error("Không nhận được access token mới từ máy chủ.");
              }

              // Cập nhật Storage với token mới (Token Rotation)
              setStoredToken(newAccessToken);
              if (newRefreshToken) {
                setStoredRefreshToken(newRefreshToken);
              }
              if (tokenData?.user) {
                setStoredUser(tokenData.user);
              }

              // Cập nhật Header mặc định cho các request tiếp theo
              apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

              // Giải phóng hàng đợi chờ
              processQueue(null, newAccessToken);

              // Thực thi lại request gốc với token mới
              return apiClient(originalRequest);
            } catch (refreshErr) {
              console.warn("[HTTP 401] Phiên đăng nhập đã hết hạn hoặc refresh token không hợp lệ:", refreshErr);
              processQueue(refreshErr, null);
              removeStoredToken();
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
              return Promise.reject(refreshErr);
            } finally {
              isRefreshing = false;
            }
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
