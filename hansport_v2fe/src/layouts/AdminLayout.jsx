import { useEffect, useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { authApi } from "../api/authApi";
import AdminSidebar from "../components/admin/shell/AdminSidebar";
import { NAV_ITEMS } from "../components/admin/shell/navItems";
import AdminTopbar from "../components/admin/shell/AdminTopbar";
import AdminMobileDrawer from "../components/admin/shell/AdminMobileDrawer";

export default function AdminLayout() {
  const { user, isAdmin, clearAuth } = useAuthStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    }
    useCartStore.getState().clearCart();
    clearAuth();
  };

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-surface-soft lg:flex">
      <AdminSidebar user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <AdminMobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      <div className="min-w-0 flex-1 flex flex-col">
        <AdminTopbar
          currentPageLabel={currentPage?.label}
          onMenuClick={() => setDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
