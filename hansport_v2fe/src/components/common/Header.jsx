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
    <header
      className={`w-full bg-surface sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_20px_rgb(0_0_0/0.08)]" : "shadow-navbar"
      }`}
    >
      <div className="hidden md:block bg-gradient-to-r from-brand-green to-brand-blue text-white text-xs">
        <div className="max-w-[1280px] mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>call</span>
            Hotline tư vấn: <strong>{hotline}</strong>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <Link to="/shop" className="hover:text-brand-green-light transition-colors">Hệ thống cửa hàng</Link>
            <Link to="/orders" className="hover:text-brand-green-light transition-colors">Tra cứu đơn hàng</Link>
            {!user ? (
              <>
                <Link to="/login" className="hover:text-brand-green-light transition-colors">Đăng nhập</Link>
                <Link to="/register" className="font-bold underline hover:opacity-80 transition-opacity">Đăng ký</Link>
              </>
            ) : (
              <span className="font-semibold">Xin chào, {user.fullName?.split(" ").pop()}!</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-surface-border">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3.5 flex items-center gap-4">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5" aria-label="HAN SPORTS - Trang chủ">
            <img
              src={LOGO_CIRCLE}
              alt=""
              className="w-10 h-10 object-contain rounded-full md:hidden"
            />
            <img
              src={LOGO_TEXT}
              alt="HAN SPORTS"
              className="hidden md:block h-9 w-auto object-contain"
            />
            <span className="md:hidden font-extrabold text-lg gradient-text">HAN SPORTS</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative" role="search">
            <label htmlFor="desktop-product-search" className="sr-only">Tìm kiếm sản phẩm</label>
            <input
              id="desktop-product-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full h-11 pl-5 pr-14 rounded-pill border-2 border-surface-border bg-surface-soft text-base text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-brand-green to-brand-blue transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            </button>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              aria-label="Mở trang tìm kiếm"
              className="md:hidden p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
              onClick={() => navigate("/shop")}
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            <button
              type="button"
              disabled
              aria-label="Danh sách yêu thích đang được phát triển"
              title="Danh sách yêu thích đang được phát triển"
              className="hidden md:flex p-2 text-text-muted rounded-lg cursor-not-allowed opacity-60"
            >
              <span className="material-symbols-outlined">favorite_border</span>
            </button>

            <Link
              to="/cart"
              aria-label={`Giỏ hàng có ${totalCount} sản phẩm`}
              className="relative p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>shopping_cart</span>
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-gradient-to-r from-brand-green to-brand-blue">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </Link>

            {!user ? (
              <Link to="/login" className="hidden md:flex btn-primary py-2 px-5 text-sm">
                Đăng nhập
              </Link>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-muted transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-r from-brand-green to-brand-blue">
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
                  <div className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-xl shadow-modal border border-surface-border py-1.5 animate-fade-up z-50" role="menu">
                    <div className="px-4 py-2 border-b border-surface-border mb-1">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.fullName}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
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
                    <div className="border-t border-surface-border mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-all"
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
              className="md:hidden p-2 text-text-secondary hover:text-brand-blue rounded-lg hover:bg-brand-blue-light transition-all"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={catalogMenuRef}
        className="hidden md:block border-b border-surface-border bg-white relative"
        onMouseLeave={() => setProductMenuOpen(false)}
      >
        <nav className="max-w-[1280px] mx-auto px-6 h-12 flex items-center gap-1" aria-label="Điều hướng chính">
          <Link
            to="/"
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              location.pathname === "/" ? "text-brand-blue" : "text-text-secondary hover:text-brand-blue"
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
                ? "text-brand-blue border-brand-blue"
                : "text-text-secondary border-transparent hover:text-brand-blue"
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
              className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-brand-blue transition-colors"
            >
              {label}
            </Link>
          ))}

          <Link
            to="/shop?sale=true"
            className="px-4 py-2 text-sm font-bold text-danger hover:text-red-700 transition-colors flex items-center gap-1 ml-auto"
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
        <div className="md:hidden border-t border-surface-border bg-white shadow-lg animate-fade-up max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3" role="search">
              <label htmlFor="mobile-product-search" className="sr-only">Tìm kiếm sản phẩm</label>
              <input
                id="mobile-product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full h-10 pl-4 pr-12 rounded-pill border border-surface-border text-sm bg-surface-soft"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-blue">
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
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light rounded-lg transition-all"
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
  );
}

function DesktopCatalogMenu({ groups, onNavigate }) {
  return (
    <div className="absolute left-0 right-0 top-full bg-white border-t border-surface-border shadow-modal z-50 animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-surface-border">
          <div>
            <p className="text-xs font-bold uppercase text-brand-teal">Danh mục sản phẩm</p>
            <p className="text-sm text-text-muted mt-1">Chọn thương hiệu để xem đúng nhóm sản phẩm.</p>
          </div>
          <Link
            to="/shop"
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-blue hover:underline"
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
                  className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-surface-border text-sm font-extrabold uppercase text-text-primary hover:text-brand-blue transition-colors"
                >
                  <span>{group.name}</span>
                  {group.productCount != null && (
                    <span className="text-[11px] font-semibold text-text-muted normal-case">
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
                      className="group flex items-center justify-between gap-3 py-1.5 text-sm text-text-secondary hover:text-brand-blue transition-colors"
                    >
                      <span className="truncate">{brand.name}</span>
                      {brand.productCount != null && (
                        <span className="text-[11px] text-text-muted group-hover:text-brand-blue">
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
          <div className="py-8 text-center text-sm text-text-muted">Chưa có dữ liệu thương hiệu.</div>
        )}
      </div>
    </div>
  );
}

function MobileCatalogMenu({ groups, onNavigate }) {
  return (
    <div className="ml-3 pl-3 border-l-2 border-brand-blue/15 space-y-4 py-2">
      <Link
        to="/shop"
        onClick={onNavigate}
        className="block text-sm font-bold text-brand-blue py-1"
      >
        Xem tất cả sản phẩm
      </Link>
      {groups.map((group) => (
        <section key={group.name}>
          <Link
            to={group.name === "Thương hiệu nổi bật" ? "/shop" : catalogPath(group.name)}
            onClick={onNavigate}
            className="block text-xs font-extrabold uppercase text-text-primary py-1"
          >
            {group.name}
          </Link>
          <div className="grid grid-cols-2 gap-x-3">
            {group.brands?.map((brand) => (
              <Link
                key={`${group.name}-${brand.name}`}
                to={catalogPath(group.name === "Thương hiệu nổi bật" ? "" : group.name, brand.name)}
                onClick={onNavigate}
                className="py-1.5 text-sm text-text-secondary hover:text-brand-blue truncate"
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
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light transition-all"
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
          ? "text-danger hover:bg-red-50"
          : "text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light"
      }`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span>
      {children}
    </Link>
  );
}
