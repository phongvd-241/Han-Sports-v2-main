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

  uploadFile: (file, folder = "product") => {
    const formData = new FormData();

    formData.append("files", file);

    return axiosInstance.post(
      `/api/v1/files?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  uploadFiles: (files, folder = "product") => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    return axiosInstance.post(
      `/api/v1/files?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  getFile: (fileName, folder = "product") =>
    axiosInstance.get(
      `/api/v1/files?folder=${encodeURIComponent(folder)}&fileName=${encodeURIComponent(fileName)}`
    ),
};