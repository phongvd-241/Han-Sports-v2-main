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
  const { setCart } = useCartStore();
  const initialized = useRef(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

    const loadCart = async () => {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) return;
      try {
        const res = await cartApi.getCart();
        const items = res.data?.data?.cartDetails || res.data?.data || [];
        setCart(items);
      } catch {
        // The cart page retries this request.
      }
    };

    tryRestoreSession().then(loadCart);
  }, [clearAuth, setAuth, setCart, user]);

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
