import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const BASE_URL = "http://localhost:8080";

// Axios instance chính — dùng cho mọi request đã xác thực
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Tự động gửi refresh_token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios instance phụ — KHÔNG có interceptor để tránh vòng lặp vô hạn
const axiosPublic = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// === REQUEST INTERCEPTOR ===
// Tự động gắn accessToken vào mọi request
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
// Nếu lỗi 401 → gọi /auth/refresh → retry request gốc
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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ xử lý 401, và không retry nếu đã thử rồi
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh — trình duyệt tự gửi cookie refresh_token
        const { data } = await axiosPublic.get("/api/v1/auth/refresh");
        const resData = data?.data || data;
        const newAccessToken = resData?.access_token || resData?.accessToken;
        
        if (!newAccessToken) throw new Error("Không lấy được access token mới");

        // Cập nhật token vào store
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Retry toàn bộ request đang chờ
        processQueue(null, newAccessToken);

        // Retry request gốc
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → đăng xuất
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        
        // Tránh vòng lặp redirect nếu đã ở trang login
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance, axiosPublic };
export default axiosInstance;
