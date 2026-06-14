import axiosInstance, { axiosPublic } from "./axiosSetup";

export const authApi = {
  login: (username, password) =>
    axiosPublic.post("/api/v1/auth/login", { username, password }),

  register: (data) =>
    axiosPublic.post("/api/v1/auth/register", data),

  getAccount: () =>
    axiosInstance.get("/api/v1/auth/account"),

  updateAccount: (data) =>
    axiosInstance.put("/api/v1/auth/account", data),

  refresh: () =>
    axiosPublic.get("/api/v1/auth/refresh"),

  logout: () =>
    axiosInstance.post("/api/v1/auth/logout"),

  changePassword: (data) =>
    axiosInstance.post("/api/v1/auth/change-password", data),

  googleLogin: (idToken) =>
    axiosPublic.post("/api/v1/auth/google", { idToken }),
};
