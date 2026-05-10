import axiosInstance from "./axiosSetup";

export const userApi = {
  getAll: (params) => axiosInstance.get("/api/v1/users", { params }),
  getById: (id) => axiosInstance.get(`/api/v1/users/${id}`),
  create: (data) => axiosInstance.post("/api/v1/users", data),
  update: (data) => axiosInstance.put("/api/v1/users", data),
  remove: (id) => axiosInstance.delete(`/api/v1/users/${id}`),
};
