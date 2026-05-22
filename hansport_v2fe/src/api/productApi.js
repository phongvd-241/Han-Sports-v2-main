import axiosInstance from "./axiosSetup";

export const productApi = {
  getAll: (params) =>
    axiosInstance.get("/api/v1/products", { params }),

  getById: (id) =>
    axiosInstance.get(`/api/v1/products/${id}`),

  create: (data) =>
    axiosInstance.post("/api/v1/products", data),

  update: (data) =>
    axiosInstance.put("/api/v1/products", data),

  remove: (id) =>
    axiosInstance.delete(`/api/v1/products/${id}`),

  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("folder", "product");
    return axiosInstance.post("/api/v1/files", formData);
  },

  uploadFiles: (files) => {
    const formData = new FormData();

    files.forEach((f) => formData.append("files", f));

    formData.append("folder", "product");

    return axiosInstance.post("/api/v1/files", formData);
  },

  getFile: (fileName) =>
    axiosInstance.get("/api/v1/files", { params: { fileName } }),
};
