import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { productApi } from "../../api/productApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import { LOGO_CIRCLE, LOGO_TEXT } from "../../utils/constants";

const DEFAULT_BRANDS = ["Yonex", "Victor", "Li-Ning", "VNB"];

function catalogPath(category, brand) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (brand) params.set("brand", brand);
  return `/shop?${params.toString()}`;
}

function isProductNavigationPath(path) {
  return path === "/shop" || path.startsWith("/shop?");
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, isAdmin } = useAuthStore();
  const { totalCount } = useCartStore();
  const { getSetting } = useSettingStore();

  const configuredNav = getSetting("HEADER_NAV", []);
  const configuredBrands = getSetting("BRANDS", DEFAULT_BRANDS);
  const secondaryNav = Array.isArray(configuredNav)
    ? configuredNav.filter((item) => (
      item?.active !== false
      && item?.path
      && item.path !== "/"
      && !isProductNavigationPath(item.path)
      && item.path !== "/shop?sale=true"
    ))
    : [];

  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const catalogMenuRef = useRef(null);
  
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

  const hotline = getSetting("HOTLINE", "090 123 4567");
  const fallbackGroups = Array.isArray(configuredBrands) && configuredBrands.length > 0
    ? [{
      name: "Thương hiệu nổi bật",
      productCount: null,
      brands: configuredBrands.map((name) => ({ name, productCount: null })),
    }]
    : [];
  const visibleCatalogGroups = catalogGroups.length > 0 ? catalogGroups : fallbackGroups;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;

    productApi.getNavigation()
      .then((response) => {
        const data = response.data?.data || response.data;
        if (active && Array.isArray(data?.categories)) {
          setCatalogGroups(data.categories);
        }
      })
      .catch((error) => {
        console.error("Không thể tải menu sản phẩm", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (catalogMenuRef.current && !catalogMenuRef.current.contains(event.target)) {
        setProductMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setProductMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setProductMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileCatalogOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;

    navigate(`/shop?q=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await authApi.logout();
    } catch (error) {
      console.error(error);
    }
    clearAuth();
    navigate("/login");
  };

  const productSectionActive = location.pathname === "/shop"
    || location.pathname.startsWith("/products/");

  return (
    <>
      {productMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-all duration-300"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          onClick={() => setProductMenuOpen(false)}
        />
      )}
      <header
        className={`w-full glass-header sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] border-b border-white/15 bg-white/40" : "bg-white/10"
        }`}
        style={{
          backdropFilter: scrolled ? "blur(32px)" : "blur(20px)",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "blur(20px)"
        }}
      >
        <div className="hidden md:block bg-white/5 backdrop-blur-sm text-white/80 text-xs border-b border-white/10">
          <div className="max-w-[1280px] mx-auto px-6 h-9 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-green-400" style={{ fontSize: 14 }}>call</span>
              Hotline tư vấn: <strong className="text-white">{hotline}</strong>
            </div>
            <div className="flex items-center gap-5 font-medium">
              <Link to="/shop" className="hover:text-green-400 transition-colors">Hệ thống cửa hàng</Link>
              <Link to="/orders" className="hover:text-green-400 transition-colors">Tra cứu đơn hàng</Link>
              {!user ? (
                <>
                  <Link to="/login" className="hover:text-green-400 transition-colors">Đăng nhập</Link>
                  <Link to="/register" className="font-bold underline hover:text-green-400 transition-colors">Đăng ký</Link>
                </>
              ) : (
                <span className="font-semibold text-white">Xin chào, {user.fullName?.split(" ").pop()}!</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-white/10">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5" aria-label="HAN SPORTS - Trang chủ">
              <img
                src={LOGO_CIRCLE}
                alt=""
                className="w-10 h-10 object-contain rounded-full md:hidden"
              />
              <div className="hidden md:block bg-white px-3 py-1.5 rounded-xl shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                <img
                  src={LOGO_TEXT}
                  alt="HAN SPORTS"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="md:hidden font-extrabold text-lg text-white">HAN SPORTS</span>
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative" role="search">
              <label htmlFor="desktop-product-search" className="sr-only">Tìm kiếm sản phẩm</label>
              <input
                id="desktop-product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                className="w-full h-11 pl-5 pr-14 rounded-pill border border-white/20 bg-white/10 text-base text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/10 transition-all duration-200"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-brand-green to-brand-blue hover:brightness-110 hover:scale-105 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
              </button>
            </form>

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                aria-label="Mở trang tìm kiếm"
                className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                onClick={() => navigate("/shop")}
              >
                <span className="material-symbols-outlined">search</span>
              </button>

            <button
              type="button"
              disabled
              aria-label="Danh sách yêu thích đang được phát triển"
              title="Danh sách yêu thích đang được phát triển"
              className="hidden md:flex p-2 text-white/30 rounded-lg cursor-not-allowed opacity-60"
            >
              <span className="material-symbols-outlined">favorite_border</span>
            </button>

            <Link
              to="/cart"
              aria-label={`Giỏ hàng có ${totalCount} sản phẩm`}
              className={`relative p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all ${cartBounce ? "animate-cart-bounce" : ""}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>shopping_cart</span>
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(22,163,74,0.5)]">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </Link>

            {!user ? (
              <Link to="/login" className="hidden md:flex glass-btn-primary py-2 px-5 text-sm">
                Đăng nhập
              </Link>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-r from-brand-green to-brand-blue ring-2 ring-white/20">
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-white/90">
                    {user.fullName?.split(" ").pop()}
                  </span>
                  <span className="material-symbols-outlined text-white/60" style={{ fontSize: 18 }}>
                    {userMenuOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl shadow-modal border border-white/10 py-1.5 animate-fade-up z-50" role="menu">
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-white/60 truncate">{user.email}</p>
                    </div>
                    <UserMenuLink to="/orders" icon="receipt_long" onClick={() => setUserMenuOpen(false)}>
                      Đơn hàng
                    </UserMenuLink>
                    <UserMenuLink to="/profile" icon="manage_accounts" onClick={() => setUserMenuOpen(false)}>
                      Tài khoản
                    </UserMenuLink>
                    {isAdmin() && (
                      <UserMenuLink to="/admin" icon="admin_panel_settings" onClick={() => setUserMenuOpen(false)}>
                        Quản trị
                      </UserMenuLink>
                    )}
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={catalogMenuRef}
        className="hidden md:block border-b border-white/10 bg-white/5 relative"
        onMouseLeave={() => setProductMenuOpen(false)}
      >
        <nav className="max-w-[1280px] mx-auto px-6 h-12 flex items-center gap-1" aria-label="Điều hướng chính">
          <Link
            to="/"
            className={`px-4 h-full inline-flex items-center text-sm font-bold border-b-2 transition-colors ${
              location.pathname === "/" 
                ? "text-white border-green-400" 
                : "text-white/70 border-transparent hover:text-white hover:border-white/20"
            }`}
          >
            Trang chủ
          </Link>

          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={productMenuOpen}
            onMouseEnter={() => setProductMenuOpen(true)}
            onFocus={() => setProductMenuOpen(true)}
            onClick={() => setProductMenuOpen(true)}
            className={`h-full px-4 inline-flex items-center gap-1 text-sm font-bold border-b-2 transition-colors ${
              productSectionActive || productMenuOpen
                ? "text-white border-green-400"
                : "text-white/70 border-transparent hover:text-white hover:border-white/20"
            }`}
          >
            Sản phẩm
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              {productMenuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {secondaryNav.map(({ label, path }) => (
            <Link
              key={`${label}-${path}`}
              to={path}
              className={`px-4 h-full inline-flex items-center text-sm font-bold border-b-2 transition-colors ${
                location.pathname === path
                  ? "text-white border-green-400"
                  : "text-white/70 border-transparent hover:text-white hover:border-white/20"
              }`}
            >
              {label}
            </Link>
          ))}

          <Link
            to="/shop?sale=true"
            className="px-4 h-full inline-flex items-center text-sm font-bold text-red-400 hover:text-red-300 transition-colors gap-1 ml-auto border-b-2 border-transparent"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_fire_department</span>
            Khuyến mãi
          </Link>
        </nav>

        {productMenuOpen && (
          <DesktopCatalogMenu groups={visibleCatalogGroups} onNavigate={() => setProductMenuOpen(false)} />
        )}
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 glass-dark shadow-lg animate-fade-up max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3" role="search">
              <label htmlFor="mobile-product-search" className="sr-only">Tìm kiếm sản phẩm</label>
              <input
                id="mobile-product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full h-10 pl-4 pr-12 rounded-pill border border-white/15 text-sm bg-white/10 text-white placeholder-white/50 focus:border-white/30 focus:ring-1 focus:ring-white/20"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80">
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>

            <MobileMenuLink to="/" icon="home" onClick={() => setMobileMenuOpen(false)}>
              Trang chủ
            </MobileMenuLink>

            <button
              type="button"
              onClick={() => setMobileCatalogOpen((open) => !open)}
              aria-expanded={mobileCatalogOpen}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 19 }}>category</span>
              <span className="flex-1 text-left">Sản phẩm theo thương hiệu</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {mobileCatalogOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {mobileCatalogOpen && (
              <MobileCatalogMenu
                groups={visibleCatalogGroups}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            )}

            {secondaryNav.map(({ label, path }) => (
              <MobileMenuLink
                key={`${label}-${path}`}
                to={path}
                icon="arrow_right"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </MobileMenuLink>
            ))}

            <MobileMenuLink to="/shop?sale=true" icon="local_fire_department" onClick={() => setMobileMenuOpen(false)} danger>
              Khuyến mãi
            </MobileMenuLink>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

function DesktopCatalogMenu({ groups, onNavigate }) {
  return (
    <div className="absolute left-0 right-0 top-full glass-dark border-t border-white/10 shadow-modal z-50 animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div>
            <p className="text-xs font-black uppercase text-green-400 tracking-wider">Danh mục sản phẩm</p>
            <p className="text-sm font-semibold text-white/80 mt-1">Chọn thương hiệu để xem đúng nhóm sản phẩm.</p>
          </div>
          <Link
            to="/shop"
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-blue-400 hover:text-blue-300 hover:underline transition-all"
          >
            Xem tất cả sản phẩm
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        {groups.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-7 max-h-[55vh] overflow-y-auto pr-2">
            {groups.map((group) => (
              <section key={group.name} aria-label={group.name}>
                <Link
                  to={group.name === "Thương hiệu nổi bật" ? "/shop" : catalogPath(group.name)}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-white/15 text-sm font-black uppercase text-white hover:text-green-400 transition-colors"
                >
                  <span>{group.name}</span>
                  {group.productCount != null && (
                    <span className="text-[11px] font-bold text-white/60 normal-case">
                      {group.productCount}
                    </span>
                  )}
                </Link>
                <div className="space-y-0.5">
                  {group.brands?.map((brand) => (
                    <Link
                      key={`${group.name}-${brand.name}`}
                      to={catalogPath(group.name === "Thương hiệu nổi bật" ? "" : group.name, brand.name)}
                      onClick={onNavigate}
                      className="group flex items-center justify-between gap-3 py-1.5 text-sm font-semibold text-white/90 hover:text-green-400 transition-colors"
                    >
                      <span className="truncate">{brand.name}</span>
                      {brand.productCount != null && (
                        <span className="text-[11px] font-bold text-white/60 group-hover:text-green-400">
                          {brand.productCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-white/40">Chưa có dữ liệu thương hiệu.</div>
        )}
      </div>
    </div>
  );
}

function MobileCatalogMenu({ groups, onNavigate }) {
  return (
    <div className="ml-3 pl-3 border-l-2 border-white/15 space-y-4 py-2">
      <Link
        to="/shop"
        onClick={onNavigate}
        className="block text-sm font-bold text-blue-400 py-1"
      >
        Xem tất cả sản phẩm
      </Link>
      {groups.map((group) => (
        <section key={group.name}>
          <Link
            to={group.name === "Thương hiệu nổi bật" ? "/shop" : catalogPath(group.name)}
            onClick={onNavigate}
            className="block text-xs font-extrabold uppercase text-white py-1"
          >
            {group.name}
          </Link>
          <div className="grid grid-cols-2 gap-x-3">
            {group.brands?.map((brand) => (
              <Link
                key={`${group.name}-${brand.name}`}
                to={catalogPath(group.name === "Thương hiệu nổi bật" ? "" : group.name, brand.name)}
                onClick={onNavigate}
                className="py-1.5 text-sm text-white/70 hover:text-green-400 truncate"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UserMenuLink({ to, icon, onClick, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
      onClick={onClick}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
      {children}
    </Link>
  );
}

function MobileMenuLink({ to, icon, onClick, children, danger = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span>
      {children}
    </Link>
  );
}
