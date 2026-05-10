import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import ProductCard from "../../components/common/ProductCard";
import { formatVND, getImageUrl } from "../../utils/constants";
import { onSync, syncEvent } from "../../utils/sync";

const PRICE_RANGES = [
  { label: "Dưới 500.000đ", min: 0, max: 500000 },
  { label: "500K - 1 triệu", min: 500000, max: 1000000 },
  { label: "1 - 3 triệu", min: 1000000, max: 3000000 },
  { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
  { label: "Trên 5 triệu", min: 5000000, max: 999999999 },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { setCart, totalCount } = useCartStore();
  const { getSetting, refreshSettings } = useSettingStore();
  
  const BRANDS = getSetting("BRANDS", ["Yonex", "Victor", "Lining", "Kawasaki", "Mizuno", "Apacs", "Flypower", "Kumpoo", "Khác"]);
  const TARGETS = getSetting("TARGETS", ["Nam", "Nữ", "Unisex", "Trẻ em"]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "0");
  const q = searchParams.get("q") || "";
  const brand = searchParams.get("brand") || "";
  const target = searchParams.get("target") || "";
  const priceKey = searchParams.get("price") || "";
  const selectedPrice = PRICE_RANGES.find((r) => r.label === priceKey);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      if (q) params.filter = `name~'${q}'`;
      const res = await productApi.getAll(params);
      const data = res.data?.data || res.data;
      setProducts(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const unsub = onSync((event) => {
      if (event === syncEvent.PRODUCT_UPDATED) fetchProducts();
      if (event === syncEvent.SETTING_UPDATED) refreshSettings();
    });
    return unsub;
  }, [fetchProducts, refreshSettings]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "0");
    setSearchParams(next);
  };

  const handleAddCart = async (product) => {
    if (!user) { toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!"); return; }
    try {
      await cartApi.addToCart(product.id, 1);
      const cartRes = await cartApi.getCart();
      setCart(cartRes.data?.data?.cartDetails || []);
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch {
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  // Filter products client-side (brand/target/price)
  const filtered = products.filter((p) => {
    if (brand && p.brand !== brand) return false;
    if (target && p.target !== target) return false;
    if (selectedPrice && (p.price < selectedPrice.min || p.price > selectedPrice.max)) return false;
    return true;
  });

  const Sidebar = () => (
    <aside className="w-full">
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 20 }}>tune</span>
          Bộ lọc sản phẩm
        </h3>

        {/* Brand filter */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Thương hiệu</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setParam("brand", "")}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${!brand ? "text-white bg-gradient-to-r from-brand-green to-brand-blue" : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
            >Tất cả</button>
            {BRANDS.map((b) => (
              <button key={b} onClick={() => setParam("brand", brand === b ? "" : b)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${brand === b ? "text-white bg-gradient-to-r from-brand-green to-brand-blue" : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Target filter */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Đối tượng</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("target", "")}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${!target ? "text-white bg-gradient-to-r from-brand-green to-brand-blue" : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}>
              Tất cả
            </button>
            {TARGETS.map((t) => (
              <button key={t} onClick={() => setParam("target", target === t ? "" : t)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${target === t ? "text-white bg-gradient-to-r from-brand-green to-brand-blue" : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Khoảng giá</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => setParam("price", "")}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${!priceKey ? "bg-brand-blue-light text-brand-blue font-semibold" : "text-text-secondary hover:bg-surface-muted"}`}>
              Tất cả mức giá
            </button>
            {PRICE_RANGES.map((r) => (
              <button key={r.label} onClick={() => setParam("price", priceKey === r.label ? "" : r.label)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${priceKey === r.label ? "bg-brand-blue-light text-brand-blue font-semibold" : "text-text-secondary hover:bg-surface-muted"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {(brand || target || priceKey) && (
          <button
            onClick={() => { setSearchParams({ page: "0" }); }}
            className="mt-4 w-full py-2 rounded-lg text-sm text-danger font-semibold hover:bg-red-50 transition-all border border-red-200 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-soft">


      {/* Page Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading font-bold text-text-primary">
                {q ? `Kết quả tìm kiếm: "${q}"` : "Tất cả sản phẩm"}
              </h1>
              {!loading && (
                <p className="text-text-muted text-sm mt-1">
                  {totalElements > 0 ? `${totalElements} sản phẩm` : "Không tìm thấy sản phẩm"}
                </p>
              )}
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-all text-sm font-semibold"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
              Bộ lọc
            </button>
          </div>
          {/* Mobile sidebar */}
          {sidebarOpen && <div className="md:hidden mt-4"><Sidebar /></div>}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Sidebar />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton h-72 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 40 }}>search_off</span>
                </div>
                <h3 className="text-title font-bold text-text-primary mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-text-muted mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button onClick={() => setSearchParams({})} className="btn-primary">Xem tất cả sản phẩm</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} onAddCart={handleAddCart} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center gap-2">
                    <button
                      onClick={() => setParam("page", String(page - 1))}
                      disabled={page === 0}
                      className="w-10 h-10 rounded-lg border border-surface-border flex items-center justify-center text-text-secondary hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                    </button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      const p_ = i;
                      const isActive = p_ === page;
                      return (
                        <button key={i} onClick={() => setParam("page", String(p_))}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${isActive ? "text-white shadow-blue-glow" : "border border-surface-border text-text-secondary hover:border-brand-blue hover:text-brand-blue"}`}
                          style={isActive ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
                        >
                          {p_ + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setParam("page", String(page + 1))}
                      disabled={page >= totalPages - 1}
                      className="w-10 h-10 rounded-lg border border-surface-border flex items-center justify-center text-text-secondary hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}