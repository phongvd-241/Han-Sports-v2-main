import axiosInstance from "./axiosSetup";

export const cartApi = {
  getCart: () => axiosInstance.get("/api/v1/carts"),

  addToCart: (productId, quantity = 1, options = {}) =>
    axiosInstance.post("/api/v1/carts/add", {
      productId,
      quantity,
      selectedColor: options.selectedColor || null,
      selectedSize: options.selectedSize || null,
    }),

  removeFromCart: (cartDetailId) =>
    axiosInstance.delete(`/api/v1/carts/${cartDetailId}`),

  updateQuantity: (cartDetailId, quantity) =>
    axiosInstance.put(`/api/v1/carts/${cartDetailId}`, { quantity }),
};
