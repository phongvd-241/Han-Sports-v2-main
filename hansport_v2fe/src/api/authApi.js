import axiosInstance, { axiosPublic } from "./axiosSetup";

export const authApi = {
  login: (username, password) =>
    axiosPublic.post("/api/v1/auth/login", { username, password }),

  register: (data) =>
    axiosPublic.post("/api/v1/auth/register", data),

  getAccount: () =>
    axiosInstance.get("/api/v1/auth/account"),

  refresh: () =>
    axiosPublic.get("/api/v1/auth/refresh"),

  logout: () =>
    axiosInstance.post("/api/v1/auth/logout"),

  // Google login: gửi ID token của Google về backend
  googleLogin: (idToken) =>
    axiosPublic.post("/api/v1/auth/google", { idToken }),
};