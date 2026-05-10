import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import { authApi } from "../../api/authApi";
import { LOGO_CIRCLE, LOGO_TEXT } from "../../utils/constants";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, isAdmin } = useAuthStore();
  const { totalCount } = useCartStore();
  const { getSetting } = useSettingStore();

  const NAV_CATEGORIES = getSetting("HEADER_NAV", [
    { label: "Trang chủ", path: "/" },
    { label: "Vợt Cầu Lông", path: "/shop?category=vot-cau-long" },
    { label: "Giày Cầu Lông", path: "/shop?category=giay-cau-long" },
    { label: "Quần Áo", path: "/shop?category=quan-ao" },
    { label: "Balo - Túi", path: "/shop?category=balo-tui" },
    { label: "Phụ Kiện", path: "/shop?category=phu-kien" },
  ]);

  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  
  const HOTLINE = getSetting("HOTLINE", "090 123 4567");

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try { await authApi.logout(); } catch (_) {}
    clearAuth();
    navigate("/login");
  };

  return (
    <header
      className={`w-full bg-surface sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_20px_rgb(0_0_0/0.08)]" : "shadow-navbar"
      }`}
    >
      {/* ── Top Bar ── */}
      <div className="hidden md:block bg-gradient-to-r from-brand-green to-brand-blue text-white text-xs">
        <div className="max-w-[1280px] mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>call</span>
            Hotline tư vấn: <strong>{HOTLINE}</strong>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <Link to="/shop" className="hover:text-brand-light-green transition-colors">Hệ thống cửa hàng</Link>
            <Link to="/orders" className="hover:text-brand-light-green transition-colors">Tra cứu đơn hàng</Link>
            {!user ? (
              <>
                <Link to="/login" className="hover:text-brand-light-green transition-colors">Đăng nhập</Link>
                <Link to="/register" className="font-bold underline hover:opacity-80 transition-opacity">Đăng ký</Link>
              </>
            ) : (
              <span className="font-semibold">Xin chào, {user.fullName?.split(" ").pop()}!</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div className="border-b border-surface-border">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5">
            <img
              src={LOGO_CIRCLE}
              alt="HAN SPORTS"
              className="w-10 h-10 object-contain rounded-full"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
            />
            <img
              src={LOGO_TEXT}
              alt="HAN SPORTS"
              className="hidden md:block h-8 object-contain"
              style={{ display: "none" }}
              onError={(e) => { e.target.style.display = "none"; }}
              onLoad={(e) => { e.target.style.display = "block"; e.target.previousSibling.style.display = "none"; }}
            />
            {/* Fallback text logo */}
            <span className="md:hidden font-extrabold text-lg gradient-text">HAN SPORTS</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full h-11 pl-5 pr-14 rounded-pill border-2 border-surface-border bg-surface-soft text-base text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all"
              style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Mobile search */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
              onClick={() => navigate("/shop")}
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            {/* Wishlist placeholder */}
            <button className="hidden md:flex p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>shopping_cart</span>
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {!user ? (
              <Link to="/login" className="hidden md:flex btn-primary py-2 px-5 text-sm">
                Đăng nhập
              </Link>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-muted transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #16a34a, #1d4ed8)" }}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-text-primary">
                    {user.fullName?.split(" ").pop()}
                  </span>
                  <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>
                    {userMenuOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-xl shadow-modal border border-surface-border py-1.5 animate-fade-up z-50">
                    <div className="px-4 py-2 border-b border-surface-border mb-1">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.fullName}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light transition-all" onClick={() => setUserMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>Đơn hàng
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light transition-all" onClick={() => setUserMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>manage_accounts</span>Tài khoản
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light transition-all" onClick={() => setUserMenuOpen(false)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>admin_panel_settings</span>Quản trị
                      </Link>
                    )}
                    <div className="border-t border-surface-border mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-all">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Nav Bar ── */}
      <div className="hidden md:block border-b border-surface-border bg-white">
        <nav className="max-w-[1280px] mx-auto px-6 h-12 flex items-center gap-1">
          {NAV_CATEGORIES.map(({ label, path }) => {
            const isActive = location.pathname + location.search === path;
            return (
              <Link
                key={label}
                to={path}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "text-white bg-gradient-to-r from-brand-green to-brand-blue"
                    : "text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            to="/shop?sale=true"
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-danger hover:bg-red-50 transition-all flex items-center gap-1 ml-auto"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_fire_department</span>
            Khuyến Mãi
          </Link>
        </nav>
      </div>

      {/* ── Mobile Dropdown ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-white shadow-lg animate-fade-up">
          <div className="px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full h-10 pl-4 pr-12 rounded-pill border border-surface-border text-sm bg-surface-soft"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-blue">
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>
            {NAV_CATEGORIES.map(({ label, path }) => (
              <Link key={label} to={path} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
