import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  cartItems: [],     // Array of cart detail objects from backend
  totalCount: 0,     // Tổng số lượng items
  selectedIds: [],   // ID các sản phẩm được chọn thanh toán

  setCart: (items) => {
    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    set({ cartItems: items, totalCount, selectedIds: items.map(i => i.id) });
  },

  addItem: (item) => {
    const items = [...get().cartItems, item];
    const totalCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    set({ cartItems: items, totalCount });
  },

  removeItem: (cartDetailId) => {
    const items = get().cartItems.filter((item) => item.id !== cartDetailId);
    const selectedIds = get().selectedIds.filter(id => id !== cartDetailId);
    const totalCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    set({ cartItems: items, totalCount, selectedIds });
  },

  removeSelectedItems: () => {
    const items = get().cartItems.filter((item) => !get().selectedIds.includes(item.id));
    const totalCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    set({ cartItems: items, totalCount, selectedIds: [] });
  },

  toggleSelect: (id) => {
    const selectedIds = get().selectedIds.includes(id)
      ? get().selectedIds.filter(i => i !== id)
      : [...get().selectedIds, id];
    set({ selectedIds });
  },

  selectAll: (select) => {
    set({ selectedIds: select ? get().cartItems.map(i => i.id) : [] });
  },

  clearCart: () => set({ cartItems: [], totalCount: 0, selectedIds: [] }),

  getTotal: () =>
    get().cartItems
      .filter(item => get().selectedIds.includes(item.id))
      .reduce(
        (sum, item) => sum + (item.product?.price || item.price || 0) * (item.quantity || 0),
        0
      ),
}));
