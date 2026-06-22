import { create } from "zustand";
import { persist } from "zustand/middleware";

export const normalizeUser = (user) => {
  if (!user) return null;
  const fullName = user.fullName || user.name || "";
  return {
    ...user,
    fullName,
    name: user.name || fullName,
  };
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null, // { id, email, fullName, role: { name, description } }

      setAuth: (accessToken, user) => set({ accessToken, user: normalizeUser(user) }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user: normalizeUser(user) }),
      clearAuth: () => set({ accessToken: null, user: null }),

      isAuthenticated: () => !!get().accessToken,
      isAdmin: () => get().user?.role?.name === "ADMIN",
    }),
    {
      name: "hansport-auth",
      // Chỉ persist user, KHÔNG persist accessToken (bảo mật)
      partialize: (state) => ({ user: state.user }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        user: normalizeUser(persistedState?.user),
      }),
    }
  )
);

