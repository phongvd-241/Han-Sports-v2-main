import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null, // { id, email, fullName, role: { name, description } }

      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ accessToken: null, user: null }),

      isAuthenticated: () => !!get().accessToken,
      isAdmin: () => get().user?.role?.name === "ADMIN",
    }),
    {
      name: "hansport-auth",
      // Chỉ persist user, KHÔNG persist accessToken (bảo mật)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
