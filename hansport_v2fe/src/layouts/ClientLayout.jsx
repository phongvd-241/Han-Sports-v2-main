import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import MobileNav from "../components/common/MobileNav";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { cartApi } from "../api/cartApi";
import { authApi } from "../api/authApi";

export default function ClientLayout() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const { setCart, clearCart } = useCartStore();
  const initialized = useRef(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Restore session once on mount if user is set in localStorage but no token in memory
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const tryRestoreSession = async () => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) return;
      if (!user) return;

      try {
        const res = await authApi.refresh();
        const newToken = res.data?.data?.accessToken;
        const accountRes = await authApi.getAccount();
        const freshUser = accountRes.data?.data?.user || accountRes.data?.data;
        if (newToken && freshUser) {
          setAuth(newToken, freshUser);
        }
      } catch {
        clearAuth();
      }
    };

    tryRestoreSession();
  }, [clearAuth, setAuth, user]);

  // Synchronize user profile and cart reactively when user logs in or out
  useEffect(() => {
    const syncProfileAndCart = async () => {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        clearCart();
        return;
      }
      try {
        // Fetch full user details if phone or address are missing from the current user object
        if (user && (user.phone === undefined || user.address === undefined)) {
          const accountRes = await authApi.getAccount();
          const freshUser = accountRes.data?.data?.user || accountRes.data?.data;
          if (freshUser) {
            setAuth(accessToken, freshUser);
          }
        }

        const res = await cartApi.getCart();
        const items = res.data?.data?.cartDetails || res.data?.data || [];
        setCart(items);
      } catch (err) {
        console.error("Error syncing profile or cart:", err);
      }
    };

    if (user) {
      syncProfileAndCart();
    } else {
      clearCart();
    }
  }, [user, setCart, clearCart, setAuth]);

  return (
    <div className="flex flex-col min-h-screen glass-theme">
      <Header />
      <main className="flex-grow pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
