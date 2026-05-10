import { Outlet, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Nếu có user persist nhưng không có accessToken → thử refresh session
    const tryRestoreSession = async () => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) return; // Đã có token, không cần restore

      if (!user) return; // Không có user persist, bỏ qua

      try {
        const res = await authApi.refresh();
        const newToken = res.data?.data?.accessToken;
        const accountRes = await authApi.getAccount();
        const freshUser = accountRes.data?.data?.user || accountRes.data?.data;
        if (newToken && freshUser) {
          setAuth(newToken, freshUser);
        }
      } catch {
        // Refresh thất bại → xóa session cũ
        clearAuth();
      }
    };

    // Load giỏ hàng nếu đã đăng nhập
    const loadCart = async () => {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) return;
      try {
        const res = await cartApi.getCart();
        const items = res.data?.data?.cartDetails || res.data?.data || [];
        setCart(items);
      } catch {
        // Silent fail — giỏ hàng sẽ load lại khi vào trang cart
      }
    };

    tryRestoreSession().then(loadCart);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-soft">
      <Header />
      <main className="flex-grow pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
