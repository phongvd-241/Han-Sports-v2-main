import axiosInstance from "./axiosSetup";

export const cartApi = {
  getCart: () => axiosInstance.get("/api/v1/carts"),

  addToCart: (productId, quantity = 1) =>
    axiosInstance.post("/api/v1/carts/add", { productId, quantity }),

  removeFromCart: (cartDetailId) =>
    axiosInstance.delete(`/api/v1/carts/${cartDetailId}`),
};
