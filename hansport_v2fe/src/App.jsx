import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Eye,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, productImageUrl } from "./api";

const fallbackHeroImage = new URL("../upload/product/1777975941237-11play-2.jpg", import.meta.url).href;

const emptyProduct = {
  id: 0,
  name: "",
  price: "",
  shortDesc: "",
  detailDesc: "",
  quantity: 0,
  sold: 0,
  brand: "",
  target: "Unisex",
  image: "",
};

const emptyUser = {
  id: 0,
  email: "",
  password: "",
  fullName: "",
  phone: "",
  address: "",
  roleName: "USER",
};

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function getInitialView() {
  return window.location.hash.replace("#", "") || "home";
}

function getProductIdFromView(view) {
  return Number(view.replace("product-", ""));
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("hs_auth");
    return raw ? JSON.parse(raw) : null;
  });
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const onHashChange = () => setView(getInitialView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(nextView) {
    window.location.hash = nextView;
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3600);
  }

  function askConfirm(options) {
    setConfirm(options);
  }

  function handleLogin(data) {
    localStorage.setItem("hs_access_token", data.access_token);
    localStorage.setItem("hs_auth", JSON.stringify(data.user));
    setAuth(data.user);
    navigate(data.user?.role?.name === "ADMIN" ? "admin-dashboard" : "shop");
  }

  async function handleLogout() {
    try {
      await apiRequest("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Clear local session even if the backend token is stale.
    }
    localStorage.removeItem("hs_access_token");
    localStorage.removeItem("hs_auth");
    setAuth(null);
    notify("Đã đăng xuất", "success");
    navigate("home");
  }

  const content = renderView({
    view,
    auth,
    navigate,
    notify,
    askConfirm,
    handleLogin,
  });

  return (
    <div className="app">
      <Header auth={auth} view={view} navigate={navigate} onLogout={handleLogout} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <main className="shell">{content}</main>
      <Footer navigate={navigate} />
      {confirm && <ConfirmDialog options={confirm} notify={notify} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function renderView({ view, auth, navigate, notify, askConfirm, handleLogin }) {
  if (view === "login") return <AuthPanel onLogin={handleLogin} notify={notify} />;
  if (view === "cart") return <CartPage auth={auth} navigate={navigate} notify={notify} askConfirm={askConfirm} />;
  if (view === "orders") return <MyOrdersPage auth={auth} navigate={navigate} notify={notify} />;
  if (view.startsWith("product-")) {
    return <ProductDetailPage productId={getProductIdFromView(view)} auth={auth} navigate={navigate} notify={notify} />;
  }
  if (view.startsWith("admin-") || view === "admin") {
    const tab = view === "admin" ? "dashboard" : view.replace("admin-", "");
    return <AdminPage tab={tab} auth={auth} navigate={navigate} notify={notify} askConfirm={askConfirm} />;
  }
  if (view === "shop") return <ShopPage auth={auth} navigate={navigate} notify={notify} />;
  return <HomePage auth={auth} navigate={navigate} notify={notify} />;
}

function Header({ auth, view, navigate, onLogout }) {
  const isAdmin = auth?.role?.name === "ADMIN";
  const activeShop = view === "shop" || view.startsWith("product-");

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")}>
        <span className="brand-mark"><Dumbbell size={18} /></span>
        <span>
          HanSport
          <small>Performance Store</small>
        </span>
      </button>

      <nav className="nav" aria-label="Điều hướng chính">
        <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>
          <Home size={18} /> Trang chủ
        </button>
        <button className={activeShop ? "active" : ""} onClick={() => navigate("shop")}>
          <Package size={18} /> Sản phẩm
        </button>
        {auth && (
          <button className={view === "cart" ? "active" : ""} onClick={() => navigate("cart")}>
            <ShoppingCart size={18} /> Giỏ hàng
          </button>
        )}
        {auth && (
          <button className={view === "orders" ? "active" : ""} onClick={() => navigate("orders")}>
            <ClipboardList size={18} /> Đơn hàng
          </button>
        )}
        {isAdmin && (
          <button className={view.startsWith("admin") ? "active" : ""} onClick={() => navigate("admin-dashboard")}>
            <Shield size={18} /> Quản trị
          </button>
        )}
      </nav>

      <div className="account">
        {auth ? (
          <>
            <span className="account-chip">
              <User size={16} />
              <span>{auth.name}</span>
            </span>
            <button className="icon-button" title="Đăng xuất" onClick={onLogout}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate("login")}>
            <User size={18} /> Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

function HomePage({ auth, navigate, notify }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/v1/products?page=0&size=6")
      .then((data) => setProducts(data?.result || []))
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Sản phẩm demo", value: products.length || 4, icon: Package },
    { label: "Vai trò", value: "Admin/User", icon: Shield },
    { label: "Flow mua hàng", value: "End-to-end", icon: Activity },
  ];

  return (
    <div className="page-fade">
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,18,15,.88), rgba(8,18,15,.48)), url(${fallbackHeroImage})` }}>
        <div className="hero-content">
          <span className="hero-kicker"><Sparkles size={16} /> HanSport v2</span>
          <h1>Trang bán đồ thể thao sẵn sàng cho buổi demo.</h1>
          <p>
            Giao diện thương mại điện tử hiện đại, dữ liệu lấy từ Spring Boot API, có giỏ hàng,
            đặt hàng và khu vực quản trị cho đồ án.
          </p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={() => navigate("shop")}>
              Khám phá sản phẩm <ArrowRight size={18} />
            </button>
            <button className="btn btn-glass" onClick={() => navigate(auth ? "cart" : "login")}>
              {auth ? "Xem giỏ hàng" : "Đăng nhập demo"}
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <span className="panel-label">Demo accounts</span>
          <strong>admin@hansport.local</strong>
          <span>Admin@123</span>
          <strong>user@hansport.local</strong>
          <span>User@123</span>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section className="feature-row">
        <FeatureCard icon={ShoppingCart} title="Mua hàng rõ ràng" text="Từ danh sách sản phẩm đến giỏ hàng và checkout đều ít bước, dễ trình bày." />
        <FeatureCard icon={LayoutDashboard} title="Quản trị chuyên nghiệp" text="Admin có dashboard, bảng dữ liệu, form quản lý và trạng thái đơn hàng." />
        <FeatureCard icon={CheckCircle2} title="Dữ liệu demo sẵn" text="Seed data giúp buổi demo bắt đầu nhanh với tài khoản và sản phẩm mẫu." />
      </section>

      <section className="section-block">
        <PageHeader
          eyebrow="Bộ sưu tập"
          title="Sản phẩm nổi bật"
          description="Các mặt hàng thể thao được chuẩn bị sẵn để demo hình ảnh, giá, tồn kho và thao tác giỏ hàng."
          action={<button className="btn btn-secondary" onClick={() => navigate("shop")}>Xem tất cả</button>}
        />
        {loading ? <SkeletonGrid /> : (
          <div className="product-grid">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} navigate={navigate} auth={auth} notify={notify} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ShopPage({ auth, navigate, notify }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState("all");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/products?page=0&size=100");
      setProducts(data?.result || []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const targets = useMemo(() => {
    const values = products.map((item) => item.target).filter(Boolean);
    return ["all", ...Array.from(new Set(values))];
  }, [products]);

  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch = !key || [item.name, item.brand, item.target, item.shortDesc].some((value) =>
        String(value || "").toLowerCase().includes(key)
      );
      const matchesTarget = target === "all" || item.target === target;
      return matchesSearch && matchesTarget;
    });
  }, [products, search, target]);

  return (
    <section className="page-fade">
      <PageHeader
        eyebrow="Cửa hàng"
        title="Danh sách sản phẩm"
        description="Tìm kiếm, xem chi tiết và thêm nhanh sản phẩm vào giỏ hàng."
        action={<button className="btn btn-secondary" onClick={loadProducts}><RefreshCw size={18} /> Tải lại</button>}
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, thương hiệu, mô tả..." />
        </div>
        <div className="filter-pills">
          {targets.map((item) => (
            <button key={item} className={target === item ? "active" : ""} onClick={() => setTarget(item)}>
              {item === "all" ? "Tất cả" : item}
            </button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="Không tìm thấy sản phẩm" text="Thử đổi từ khóa hoặc bộ lọc để xem thêm sản phẩm." />
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} navigate={navigate} auth={auth} notify={notify} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductDetailPage({ productId, auth, navigate, notify }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/v1/products/${productId}`)
      .then(setProduct)
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, [productId]);

  async function addToCart() {
    if (!auth) {
      navigate("login");
      return;
    }
    setBusy(true);
    try {
      await apiRequest("/api/v1/carts/add", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      notify("Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return <EmptyState icon={Package} title="Không có dữ liệu" text="Sản phẩm không tồn tại hoặc backend chưa phản hồi." />;

  const image = productImageUrl(product.image);

  return (
    <section className="detail-page page-fade">
      <button className="back-link" onClick={() => navigate("shop")}><ChevronRight size={18} /> Quay lại sản phẩm</button>
      <div className="detail-grid">
        <div className="detail-media">
          {image ? <img src={image} alt={product.name} /> : <span>{product.brand || "HanSport"}</span>}
        </div>
        <div className="detail-info">
          <div className="detail-title">
            <Badge tone={product.quantity > 0 ? "success" : "danger"}>{product.quantity > 0 ? "Còn hàng" : "Hết hàng"}</Badge>
            <h1>{product.name}</h1>
            <p>{product.shortDesc}</p>
          </div>
          <div className="detail-price">{currency.format(product.price || 0)}</div>
          <div className="info-grid">
            <InfoTile label="Thương hiệu" value={product.brand || "HanSport"} />
            <InfoTile label="Đối tượng" value={product.target || "Unisex"} />
            <InfoTile label="Tồn kho" value={`${product.quantity || 0} sản phẩm`} />
            <InfoTile label="Đã bán" value={`${product.sold || 0} sản phẩm`} />
          </div>
          <p className="detail-desc">{product.detailDesc}</p>
          <div className="detail-actions">
            <button className="btn btn-primary" disabled={busy || product.quantity < 1} onClick={addToCart}>
              <ShoppingCart size={18} /> {busy ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(auth ? "cart" : "login")}>
              <CreditCard size={18} /> Thanh toán
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, navigate, auth, notify }) {
  const [busy, setBusy] = useState(false);

  async function addToCart(event) {
    event.stopPropagation();
    if (!auth) {
      navigate("login");
      return;
    }
    setBusy(true);
    try {
      await apiRequest("/api/v1/carts/add", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      notify("Đã thêm vào giỏ hàng");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="product-card" onClick={() => navigate(`product-${product.id}`)}>
      <ProductImage product={product} />
      <div className="product-body">
        <div className="product-meta-line">
          <span>{product.brand || "HanSport"}</span>
          <Badge tone={product.quantity > 0 ? "success" : "danger"}>{product.quantity > 0 ? "Còn hàng" : "Hết hàng"}</Badge>
        </div>
        <div>
          <h2>{product.name}</h2>
          <p>{product.shortDesc}</p>
        </div>
        <div className="product-actions">
          <strong>{currency.format(product.price || 0)}</strong>
          <div>
            <button className="icon-button" title="Xem chi tiết" onClick={(event) => { event.stopPropagation(); navigate(`product-${product.id}`); }}>
              <Eye size={18} />
            </button>
            <button className="btn btn-primary" disabled={busy || product.quantity < 1} onClick={addToCart}>
              <ShoppingCart size={18} /> {busy ? "..." : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductImage({ product }) {
  const src = productImageUrl(product.image);
  return (
    <div className="product-media">
      {src ? <img src={src} alt={product.name} /> : <span>{product.brand || "HanSport"}</span>}
    </div>
  );
}

function AuthPanel({ onLogin, notify }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", email: "", fullName: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function useDemo(email, password) {
    setMode("login");
    setForm((current) => ({ ...current, username: email, password }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        await apiRequest("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
          }),
        });
        notify("Đăng ký thành công");
        setMode("login");
        setForm((current) => ({ ...current, username: current.email }));
      } else {
        const data = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        notify("Đăng nhập thành công");
        onLogin(data);
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-layout page-fade">
      <div className="auth-visual" style={{ backgroundImage: `linear-gradient(150deg, rgba(8,18,15,.92), rgba(8,18,15,.45)), url(${fallbackHeroImage})` }}>
        <span className="hero-kicker"><Dumbbell size={16} /> HanSport Account</span>
        <h1>{mode === "login" ? "Chào mừng trở lại." : "Tạo tài khoản mua hàng."}</h1>
        <p>Đăng nhập để thêm giỏ hàng, đặt đơn và theo dõi trạng thái xử lý.</p>
        <div className="demo-chips">
          <button type="button" onClick={() => useDemo("admin@hansport.local", "Admin@123")}>Admin demo</button>
          <button type="button" onClick={() => useDemo("user@hansport.local", "User@123")}>User demo</button>
        </div>
      </div>
      <form className="surface form auth-form" onSubmit={submit}>
        <div className="form-head">
          <p className="eyebrow">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</p>
          <h1>{mode === "login" ? "Truy cập hệ thống" : "Tạo tài khoản mới"}</h1>
        </div>
        {mode === "register" ? (
          <>
            <Field label="Email"><input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></Field>
            <Field label="Họ tên"><input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Nguyễn Văn A" /></Field>
            <Field label="Số điện thoại"><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="0900000000" /></Field>
            <Field label="Địa chỉ"><input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Địa chỉ nhận hàng" /></Field>
          </>
        ) : (
          <Field label="Email"><input value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="admin@hansport.local" /></Field>
        )}
        <Field label="Mật khẩu"><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="••••••••" /></Field>
        <button className="btn btn-primary wide" disabled={busy}>
          {busy ? <span className="spinner" /> : <User size={18} />}
          {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
        <button type="button" className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Tạo tài khoản user mới" : "Tôi đã có tài khoản"}
        </button>
      </form>
    </section>
  );
}

function CartPage({ auth, navigate, notify, askConfirm }) {
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState({ receiverName: auth?.name || "", receiverPhone: "", receiverAddress: "" });

  useEffect(() => {
    if (!auth) navigate("login");
    else {
      loadCart();
      loadOrders();
    }
  }, [auth]);

  async function loadCart() {
    setLoading(true);
    try {
      setCart(await apiRequest("/api/v1/carts"));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const data = await apiRequest("/api/v1/orders/my?page=0&size=20");
      setOrders(data?.result || []);
    } catch {
      setOrders([]);
    }
  }

  function removeItem(id) {
    askConfirm({
      title: "Xóa sản phẩm khỏi giỏ hàng?",
      message: "Sản phẩm sẽ được xóa khỏi giỏ hàng hiện tại.",
      confirmText: "Xóa sản phẩm",
      tone: "danger",
      onConfirm: async () => {
        await apiRequest(`/api/v1/carts/${id}`, { method: "DELETE" });
        notify("Đã xóa sản phẩm khỏi giỏ hàng");
        loadCart();
      },
    });
  }

  async function placeOrder(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/api/v1/orders", { method: "POST", body: JSON.stringify(checkout) });
      notify("Đặt hàng thành công");
      setCheckout({ receiverName: auth?.name || "", receiverPhone: "", receiverAddress: "" });
      loadCart();
      loadOrders();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const details = cart?.cartDetails || [];
  const total = details.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="cart-page page-fade">
      <PageHeader
        eyebrow="Thanh toán"
        title="Giỏ hàng của bạn"
        description="Kiểm tra sản phẩm, tổng tiền và hoàn tất thông tin nhận hàng."
        action={<button className="btn btn-secondary" onClick={loadCart}><RefreshCw size={18} /> Tải lại</button>}
      />
      <div className="checkout-grid">
        <div className="surface list-panel">
          {loading ? <CartSkeleton /> : details.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Giỏ hàng đang trống" text="Hãy chọn một vài sản phẩm trước khi đặt hàng." action={<button className="btn btn-primary" onClick={() => navigate("shop")}>Xem sản phẩm</button>} />
          ) : details.map((item) => (
            <div className="line-item" key={item.id}>
              {productImageUrl(item.product?.image) ? (
                <img src={productImageUrl(item.product?.image)} alt={item.product?.name || ""} />
              ) : (
                <span className="line-thumb">HS</span>
              )}
              <div>
                <strong>{item.product?.name}</strong>
                <span>{item.quantity} x {currency.format(item.price)}</span>
              </div>
              <button className="icon-button danger" title="Xóa" onClick={() => removeItem(item.id)}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        <aside className="checkout-summary">
          <div className="surface summary-card">
            <h2>Tóm tắt đơn hàng</h2>
            <SummaryRow label="Số dòng sản phẩm" value={details.length} />
            <SummaryRow label="Tổng tiền" value={currency.format(total)} strong />
          </div>
          <form className="surface form" onSubmit={placeOrder}>
            <h2>Thông tin nhận hàng</h2>
            <Field label="Người nhận"><input value={checkout.receiverName} onChange={(event) => setCheckout({ ...checkout, receiverName: event.target.value })} placeholder="Tên người nhận" /></Field>
            <Field label="Số điện thoại"><input value={checkout.receiverPhone} onChange={(event) => setCheckout({ ...checkout, receiverPhone: event.target.value })} placeholder="0900000000" /></Field>
            <Field label="Địa chỉ"><input value={checkout.receiverAddress} onChange={(event) => setCheckout({ ...checkout, receiverAddress: event.target.value })} placeholder="Địa chỉ giao hàng" /></Field>
            <button className="btn btn-primary wide" disabled={busy || details.length === 0}>
              {busy ? <span className="spinner" /> : <CreditCard size={18} />}
              {busy ? "Đang đặt hàng..." : "Đặt hàng"}
            </button>
          </form>
          <OrderMiniList orders={orders} />
        </aside>
      </div>
    </section>
  );
}

function MyOrdersPage({ auth, navigate, notify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) navigate("login");
    else {
      apiRequest("/api/v1/orders/my?page=0&size=50")
        .then((data) => setOrders(data?.result || []))
        .catch((error) => notify(error.message, "error"))
        .finally(() => setLoading(false));
    }
  }, [auth]);

  return (
    <section className="page-fade">
      <PageHeader
        eyebrow="Tài khoản"
        title="Đơn hàng của tôi"
        description="Theo dõi các đơn đã đặt và trạng thái xử lý hiện tại."
      />
      {loading ? <TableSkeleton /> : <OrderTable orders={orders} />}
    </section>
  );
}

function AdminPage({ tab, auth, navigate, notify, askConfirm }) {
  const activeTab = ["dashboard", "products", "users", "orders"].includes(tab) ? tab : "dashboard";

  useEffect(() => {
    if (!auth) navigate("login");
    else if (auth.role?.name !== "ADMIN") navigate("shop");
  }, [auth]);

  if (!auth || auth.role?.name !== "ADMIN") return null;

  return (
    <AdminShell active={activeTab} navigate={navigate} auth={auth}>
      {activeTab === "dashboard" && <AdminDashboard navigate={navigate} notify={notify} />}
      {activeTab === "products" && <AdminProducts notify={notify} askConfirm={askConfirm} />}
      {activeTab === "users" && <AdminUsers notify={notify} askConfirm={askConfirm} />}
      {activeTab === "orders" && <AdminOrders notify={notify} />}
    </AdminShell>
  );
}

function AdminShell({ active, navigate, auth, children }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "users", label: "Tài khoản", icon: Users },
    { id: "orders", label: "Đơn hàng", icon: ClipboardList },
  ];

  return (
    <section className="admin-layout page-fade">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <span className="avatar"><Shield size={20} /></span>
          <div>
            <strong>{auth.name}</strong>
            <small>Quản trị viên</small>
          </div>
        </div>
        <nav>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => navigate(`admin-${item.id}`)}>
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="admin-content">{children}</div>
    </section>
  );
}

function AdminDashboard({ navigate, notify }) {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/v1/products?page=0&size=100"),
      apiRequest("/api/v1/users?page=0&size=100"),
      apiRequest("/api/v1/orders?page=0&size=100"),
    ])
      .then(([productData, userData, orderData]) => {
        setProducts(productData?.result || []);
        setUsers(userData?.result || []);
        setOrders(orderData?.result || []);
      })
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const pending = orders.filter((order) => order.status === "PENDING").length;
  const lowStock = products.filter((product) => Number(product.quantity || 0) <= 5);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Dashboard tổng quan"
        description="Các chỉ số chính phục vụ buổi demo quản trị HanSport."
        action={<button className="btn btn-primary" onClick={() => navigate("admin-products")}><Plus size={18} /> Thêm sản phẩm</button>}
      />
      {loading ? <SkeletonGrid /> : (
        <>
          <section className="stats-grid admin-stats">
            <StatCard label="Sản phẩm" value={products.length} icon={Package} />
            <StatCard label="Tài khoản" value={users.length} icon={Users} />
            <StatCard label="Đơn chờ xử lý" value={pending} icon={ClipboardList} />
            <StatCard label="Doanh thu demo" value={currency.format(revenue)} icon={BarChart3} />
          </section>
          <div className="dashboard-grid">
            <div className="surface table-wrap">
              <div className="panel-head">
                <h2>Đơn hàng gần đây</h2>
                <button className="link-button" onClick={() => navigate("admin-orders")}>Xem tất cả</button>
              </div>
              <OrderTable orders={orders.slice(0, 5)} compact />
            </div>
            <div className="surface panel">
              <div className="panel-head">
                <h2>Sắp hết hàng</h2>
                <button className="link-button" onClick={() => navigate("admin-products")}>Quản lý kho</button>
              </div>
              {lowStock.length === 0 ? <EmptyState icon={CheckCircle2} title="Kho ổn định" text="Không có sản phẩm ở ngưỡng tồn kho thấp." compact /> : (
                <div className="mini-list">
                  {lowStock.slice(0, 6).map((product) => (
                    <div className="mini-row" key={product.id}>
                      <span>{product.name}</span>
                      <Badge tone="warning">{product.quantity} còn lại</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminProducts({ notify, askConfirm }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/products?page=0&size=100");
      setProducts(data?.result || []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function uploadImage(file) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "product");
    try {
      const data = await apiRequest("/api/v1/files", { method: "POST", body });
      update("image", data.fileName || data.name || data);
      notify("Tải ảnh thành công");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity), sold: Number(form.sold || 0) };
      await apiRequest("/api/v1/products", {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      notify("Đã lưu sản phẩm");
      setForm(emptyProduct);
      load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function remove(product) {
    askConfirm({
      title: "Xóa sản phẩm?",
      message: `Sản phẩm "${product.name}" sẽ bị xóa khỏi danh sách.`,
      confirmText: "Xóa sản phẩm",
      tone: "danger",
      onConfirm: async () => {
        await apiRequest(`/api/v1/products/${product.id}`, { method: "DELETE" });
        notify("Đã xóa sản phẩm");
        load();
      },
    });
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Quản lý sản phẩm" description="Thêm, sửa, upload ảnh và kiểm soát tồn kho sản phẩm." />
      <div className="admin-grid">
        <form className="surface form admin-form" onSubmit={save}>
          <div className="form-head">
            <h2>{form.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
            {form.id > 0 && <Badge tone="info">#{form.id}</Badge>}
          </div>
          <Field label="Tên sản phẩm"><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Giày đá bóng..." /></Field>
          <div className="form-row">
            <Field label="Giá"><input type="number" value={form.price} onChange={(event) => update("price", event.target.value)} /></Field>
            <Field label="Số lượng"><input type="number" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} /></Field>
          </div>
          <div className="form-row">
            <Field label="Thương hiệu"><input value={form.brand} onChange={(event) => update("brand", event.target.value)} /></Field>
            <Field label="Đối tượng"><input value={form.target} onChange={(event) => update("target", event.target.value)} /></Field>
          </div>
          <Field label="Mô tả ngắn"><input value={form.shortDesc} onChange={(event) => update("shortDesc", event.target.value)} /></Field>
          <Field label="Mô tả chi tiết"><textarea value={form.detailDesc} onChange={(event) => update("detailDesc", event.target.value)} /></Field>
          <label className="file-label"><Upload size={18} /> Chọn ảnh sản phẩm<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} /></label>
          {form.image && <img className="preview" src={productImageUrl(form.image)} alt="" />}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(emptyProduct)}>Làm mới</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Save size={18} />} Lưu</button>
          </div>
        </form>
        <div className="surface table-wrap">
          {loading ? <TableSkeleton /> : (
            <table>
              <thead><tr><th>Sản phẩm</th><th>Giá</th><th>Kho</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        {productImageUrl(product.image) ? <img src={productImageUrl(product.image)} alt="" /> : <span>HS</span>}
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{currency.format(product.price || 0)}</td>
                    <td>{product.quantity}</td>
                    <td><Badge tone={product.quantity > 0 ? "success" : "danger"}>{product.quantity > 0 ? "Còn hàng" : "Hết hàng"}</Badge></td>
                    <td className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setForm({ ...emptyProduct, ...product })}>Sửa</button>
                      <button className="icon-button danger" title="Xóa" onClick={() => remove(product)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ notify, askConfirm }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/users?page=0&size=100");
      setUsers(data?.result || []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (form.id) delete payload.password;
      await apiRequest("/api/v1/users", { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      notify("Đã lưu tài khoản");
      setForm(emptyUser);
      load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function remove(user) {
    askConfirm({
      title: "Xóa tài khoản?",
      message: `Tài khoản ${user.email} sẽ bị xóa khỏi hệ thống.`,
      confirmText: "Xóa tài khoản",
      tone: "danger",
      onConfirm: async () => {
        await apiRequest(`/api/v1/users/${user.id}`, { method: "DELETE" });
        notify("Đã xóa tài khoản");
        load();
      },
    });
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Quản lý tài khoản" description="Tạo tài khoản demo, cập nhật thông tin và phân quyền." />
      <div className="admin-grid">
        <form className="surface form admin-form" onSubmit={save}>
          <div className="form-head">
            <h2>{form.id ? "Sửa tài khoản" : "Thêm tài khoản"}</h2>
            {form.id > 0 && <Badge tone="info">#{form.id}</Badge>}
          </div>
          <Field label="Email"><input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="demo@hansport.local" /></Field>
          {!form.id && <Field label="Mật khẩu"><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="User@123" /></Field>}
          <Field label="Họ tên"><input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} /></Field>
          <div className="form-row">
            <Field label="Số điện thoại"><input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
            <Field label="Role"><select value={form.roleName} onChange={(event) => update("roleName", event.target.value)}><option>USER</option><option>ADMIN</option></select></Field>
          </div>
          <Field label="Địa chỉ"><input value={form.address} onChange={(event) => update("address", event.target.value)} /></Field>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(emptyUser)}>Làm mới</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Save size={18} />} Lưu</button>
          </div>
        </form>
        <div className="surface table-wrap">
          {loading ? <TableSkeleton /> : (
            <table>
              <thead><tr><th>Email</th><th>Họ tên</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.fullName}</td>
                    <td><Badge tone={user.role?.name === "ADMIN" ? "warning" : "info"}>{user.role?.name}</Badge></td>
                    <td className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setForm({ ...emptyUser, ...user, roleName: user.role?.name || "USER", password: "" })}>Sửa</button>
                      <button className="icon-button danger" title="Xóa" onClick={() => remove(user)}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminOrders({ notify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/v1/orders?page=0&size=100");
      setOrders(data?.result || []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order, status) {
    try {
      await apiRequest("/api/v1/orders", { method: "PUT", body: JSON.stringify({ id: order.id, status }) });
      notify("Đã cập nhật đơn hàng");
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Quản lý đơn hàng"
        description="Theo dõi đơn hàng và cập nhật trạng thái xử lý."
        action={<button className="btn btn-secondary" onClick={load}><RefreshCw size={18} /> Tải lại</button>}
      />
      <div className="surface table-wrap">
        {loading ? <TableSkeleton /> : (
          <table>
            <thead><tr><th>Mã</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.receiverName}</td>
                  <td>{currency.format(order.totalPrice || 0)}</td>
                  <td>
                    <select className="table-select" value={order.status} onChange={(event) => updateStatus(order, event.target.value)}>
                      <option>PENDING</option>
                      <option>CONFIRMED</option>
                      <option>SHIPPING</option>
                      <option>COMPLETED</option>
                      <option>CANCELLED</option>
                    </select>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="surface stat-card">
      <span><Icon size={22} /></span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <span><Icon size={22} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

function Badge({ tone = "info", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function InfoTile({ label, value }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      {strong ? <strong>{value}</strong> : <span>{value}</span>}
    </div>
  );
}

function OrderMiniList({ orders }) {
  return (
    <div className="surface mini-orders">
      <h2>Đơn gần đây</h2>
      {orders.slice(0, 4).map((order) => (
        <div className="mini-order" key={order.id}>
          <span>#{order.id} · {order.status}</span>
          <strong>{currency.format(order.totalPrice || 0)}</strong>
        </div>
      ))}
      {orders.length === 0 && <p className="muted">Chưa có đơn hàng</p>}
    </div>
  );
}

function OrderTable({ orders, compact = false }) {
  if (!orders.length) return <EmptyState icon={ClipboardList} title="Chưa có đơn hàng" text="Khi có đơn mới, dữ liệu sẽ xuất hiện tại đây." compact={compact} />;
  return (
    <table>
      <thead><tr><th>Mã</th><th>Người nhận</th><th>Tổng tiền</th><th>Trạng thái</th>{!compact && <th>Ngày tạo</th>}</tr></thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.receiverName}</td>
            <td>{currency.format(order.totalPrice || 0)}</td>
            <td><Badge tone={statusTone(order.status)}>{order.status}</Badge></td>
            {!compact && <td>{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState({ icon: Icon = Sparkles, title, text, action, compact = false }) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <span><Icon size={26} /></span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.type === "error" ? <X size={18} /> : <CheckCircle2 size={18} />}</span>
      <p>{toast.message}</p>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function ConfirmDialog({ options, notify, onClose }) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await options.onConfirm();
      onClose();
    } catch (error) {
      notify(error.message || "Thao tác không thành công", "error");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal surface" role="dialog" aria-modal="true">
        <div className={`modal-icon ${options.tone === "danger" ? "danger" : ""}`}>
          {options.tone === "danger" ? <Trash2 size={22} /> : <CheckCircle2 size={22} />}
        </div>
        <h2>{options.title}</h2>
        <p>{options.message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className={`btn ${options.tone === "danger" ? "btn-danger" : "btn-primary"}`} onClick={confirm} disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {options.confirmText || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div>
        <strong>HanSport v2</strong>
        <p>Đồ án web bán đồ thể thao với Spring Boot REST API và React.</p>
      </div>
      <button className="link-button" onClick={() => navigate("shop")}>Xem sản phẩm</button>
    </footer>
  );
}

function SkeletonGrid() {
  return (
    <div className="product-grid">
      {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="surface skeleton-card">
      <div className="skeleton media" />
      <div className="skeleton-content">
        <div className="skeleton line short" />
        <div className="skeleton line" />
        <div className="skeleton line" />
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="detail-grid">
      <div className="skeleton detail-media" />
      <div className="surface skeleton-detail">
        <div className="skeleton line short" />
        <div className="skeleton line title" />
        <div className="skeleton line" />
        <div className="skeleton line" />
      </div>
    </div>
  );
}

function CartSkeleton() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div className="line-item" key={index}>
      <div className="skeleton thumb" />
      <div>
        <div className="skeleton line short" />
        <div className="skeleton line" />
      </div>
      <div className="skeleton action" />
    </div>
  ));
}

function TableSkeleton() {
  return (
    <div className="table-skeleton">
      {Array.from({ length: 5 }).map((_, index) => <div className="skeleton table-line" key={index} />)}
    </div>
  );
}

function statusTone(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CONFIRMED":
    case "SHIPPING":
      return "info";
    case "CANCELLED":
      return "danger";
    default:
      return "warning";
  }
}
