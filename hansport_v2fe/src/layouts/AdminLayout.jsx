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

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    clearAuth();
  };

  const currentPage = NAV_ITEMS.find((n) =>
    n.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(n.path)
  );

  return (
    <div className="flex h-screen bg-surface-soft overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: "linear-gradient(180deg, #0f1e3d 0%, #162550 100%)" }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_CIRCLE} alt="HAN SPORTS" className="w-10 h-10 rounded-full object-contain bg-white p-1" />
            <div>
              <p className="text-white font-extrabold text-base leading-none">HAN SPORTS</p>
              <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon, path }) => {
            const isActive = path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-blue-glow"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                style={isActive ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}>
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/50 hover:text-white text-xs transition-colors w-full py-2 rounded-lg hover:bg-white/5 px-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-surface-border px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{currentPage?.label || "Admin"}</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-brand-blue font-semibold hover:underline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            Xem trang khách
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-surface-soft">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
