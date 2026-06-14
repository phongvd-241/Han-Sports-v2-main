import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL } from "../utils/constants";

const BASE_URL = API_BASE_URL;

// Do not force a default Content-Type. Axios must detect JSON and FormData itself.
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Public instance without refresh interception to avoid an infinite refresh loop.
const axiosPublic = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axiosPublic.get("/api/v1/auth/refresh");
        const responseData = data?.data || data;
        const newAccessToken = responseData?.access_token || responseData?.accessToken;

        if (!newAccessToken) {
          throw new Error("Không lấy được access token mới");
        }

        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { axiosInstance, axiosPublic };
export default axiosInstance;
