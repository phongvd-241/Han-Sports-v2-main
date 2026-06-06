import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { authApi } from "../api/authApi";
import { LOGO_CIRCLE } from "../utils/constants";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/admin" },
  { label: "Sản phẩm", icon: "inventory_2", path: "/admin/products" },
  { label: "Đơn hàng", icon: "receipt_long", path: "/admin/orders" },
  { label: "Người dùng", icon: "group", path: "/admin/users" },
  { label: "Cấu hình", icon: "settings", path: "/admin/settings" },
];

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
    clearAuth();
  };

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-surface-soft lg:flex">
      <DesktopSidebar user={user} onLogout={handleLogout} currentPath={location.pathname} />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Đóng menu quản trị"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-admin-bg text-white shadow-modal animate-slide-in">
            <SidebarContent user={user} onLogout={handleLogout} currentPath={location.pathname} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-surface-border px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-surface-muted hover:text-brand-blue transition-all"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu quản trị"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-text-primary truncate">{currentPage?.label || "Admin"}</h1>
              <p className="text-xs text-text-muted mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-brand-blue font-semibold hover:underline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            <span className="hidden sm:inline">Xem trang khách</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar({ user, onLogout, currentPath }) {
  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-admin-bg text-white">
      <SidebarContent user={user} onLogout={onLogout} currentPath={currentPath} />
    </aside>
  );
}

function SidebarContent({ user, onLogout, currentPath }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <img src={LOGO_CIRCLE} alt="HAN SPORTS" className="w-10 h-10 rounded-full object-contain bg-white p-1" />
          <div>
            <p className="text-white font-extrabold text-base leading-none">HAN SPORTS</p>
            <p className="text-white/45 text-xs mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const isActive = path === "/admin" ? currentPath === "/admin" : currentPath.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive ? "bg-white text-admin-bg" : "text-white/65 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.fullName || user?.name}</p>
            <p className="text-white/45 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-white/60 hover:text-white text-xs transition-colors w-full py-2 rounded-lg hover:bg-white/10 px-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
