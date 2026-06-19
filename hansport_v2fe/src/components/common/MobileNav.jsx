import { Link, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useState, useRef, useEffect } from "react";

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
  
  const [cartBounce, setCartBounce] = useState(false);
  const prevCountRef = useRef(totalCount);

  useEffect(() => {
    if (totalCount > prevCountRef.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 800);
      return () => clearTimeout(t);
    }
    prevCountRef.current = totalCount;
  }, [totalCount]);

  return (
    <nav className="fixed bottom-0 w-full z-50 md:hidden bg-white/10 backdrop-blur-xl border-t border-white/15 shadow-[0_-4px_30px_rgba(0,0,0,0.25)]">
      <div className="flex justify-around h-16 max-w-sm mx-auto">
        {NAV.map(({ icon, label, path, authPath }) => {
          const to = icon === "person" ? (user ? path : authPath) : path;
          const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          return (
            <Link key={label} to={to}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors ${isActive ? "text-white" : "text-white/50"}`}
            >
              <span className={`relative ${icon === "shopping_bag" && cartBounce ? "animate-cart-bounce" : ""}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                {icon === "shopping_bag" && totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_6px_rgba(22,163,74,0.5)]">
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold ${isActive ? "text-white font-bold" : "text-white/50"}`}>{label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
