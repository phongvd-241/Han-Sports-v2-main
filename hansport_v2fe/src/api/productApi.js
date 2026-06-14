import axiosInstance from "./axiosSetup";

export const productApi = {
  getAll: (params) => axiosInstance.get("/api/v1/products", { params }),

  getById: (id) => axiosInstance.get(`/api/v1/products/${id}`),

  create: (data) => axiosInstance.post("/api/v1/products", data),

  update: (data) => axiosInstance.put("/api/v1/products", data),

  remove: (id) => axiosInstance.delete(`/api/v1/products/${id}`),

  importProducts: (file, dryRun = true) => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosInstance.post("/api/v1/products/import", formData, {
      params: { dryRun },
    });
  },

  uploadFile: (file, folder = "product") => {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("folder", folder);

    return axiosInstance.post("/api/v1/files", formData);
  },

  uploadFiles: (files, folder = "product") => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("folder", folder);

    return axiosInstance.post("/api/v1/files", formData);
  },

  getFile: (fileName) =>
    axiosInstance.get("/api/v1/files", { params: { fileName } }),
};
