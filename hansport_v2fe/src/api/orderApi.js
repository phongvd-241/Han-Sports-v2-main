import axiosInstance from "./axiosSetup";

export const orderApi = {
  createOrder: (data) => axiosInstance.post("/api/v1/orders", data),
  getMyOrders: () => axiosInstance.get("/api/v1/orders/my"),
  getAllOrders: (params) => axiosInstance.get("/api/v1/orders", { params }),
  updateOrder: (data) => axiosInstance.put("/api/v1/orders", data),
  deleteOrder: (id) => axiosInstance.delete(`/api/v1/orders/${id}`),
};
