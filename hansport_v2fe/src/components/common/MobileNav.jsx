import { Link, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";

const NAV = [
  { icon: "home", label: "Trang chủ", path: "/" },
  { icon: "category", label: "Danh mục", path: "/shop" },
  { icon: "shopping_bag", label: "Giỏ hàng", path: "/cart" },
  { icon: "person", label: "Tài khoản", path: "/orders", authPath: "/login" },
];

export default function MobileNav() {
  const location = useLocation();
  const { totalCount } = useCartStore();
  const { user } = useAuthStore();

  return (
    <nav className="fixed bottom-0 w-full z-50 md:hidden bg-white border-t border-surface-border shadow-[0_-4px_20px_rgb(0_0_0/0.06)]">
      <div className="flex justify-around h-16 max-w-sm mx-auto">
        {NAV.map(({ icon, label, path, authPath }) => {
          const to = icon === "person" ? (user ? path : authPath) : path;
          const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          return (
            <Link key={label} to={to}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors ${isActive ? "text-brand-blue" : "text-text-muted"}`}
            >
              <span className="relative">
                <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                {icon === "shopping_bag" && totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}>
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold ${isActive ? "text-brand-blue" : "text-text-muted"}`}>{label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: "linear-gradient(to right, #16a34a, #1d4ed8)" }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
