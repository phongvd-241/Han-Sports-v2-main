import { Link } from "react-router-dom";
import { LOGO_CIRCLE, API_BASE_URL } from "../../../utils/constants";
import { NAV_ITEMS } from "./navItems";

export function SidebarContent({ user, onLogout, currentPath }) {
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

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
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
          {user?.avatar ? (
            <img
              src={`${API_BASE_URL}/api/v1/files?fileName=${encodeURIComponent(user.avatar)}&folder=avatar`}
              alt="Avatar"
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}
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

export default function AdminSidebar({ user, onLogout, currentPath }) {
  return (
    <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-shrink-0 flex-col bg-admin-bg text-white">
      <SidebarContent user={user} onLogout={onLogout} currentPath={currentPath} />
    </aside>
  );
}
