import axiosInstance from "./axiosSetup";

export const userApi = {
  getAll: (params) => axiosInstance.get("/api/v1/users", { params }),
  getById: (id) => axiosInstance.get(`/api/v1/users/${id}`),
  create: (data) => axiosInstance.post("/api/v1/users", data),
  update: (data) => axiosInstance.put("/api/v1/users", data),
  updateLockStatus: (id, locked) => axiosInstance.patch(`/api/v1/users/${id}/locked`, { locked }),
  remove: (id) => axiosInstance.delete(`/api/v1/users/${id}`),
};
