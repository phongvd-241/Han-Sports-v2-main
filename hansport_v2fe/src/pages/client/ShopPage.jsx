import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import ProductCard from "../../components/common/ProductCard";
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
  const { setCart } = useCartStore();
  const { getSetting, refreshSettings } = useSettingStore();
  
  const configuredBrands = getSetting("BRANDS", ["Yonex", "Victor", "Li-Ning", "VNB"]);
  const TARGETS = getSetting("TARGETS", ["Nam", "Nữ", "Unisex", "Trẻ em"]);

  const [products, setProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "0");
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const target = searchParams.get("target") || "";
  const priceKey = searchParams.get("price") || "";
  const selectedPrice = PRICE_RANGES.find((r) => r.label === priceKey);
  const selectedCategory = catalogCategories.find((item) => item.name === category);
  const catalogBrands = (selectedCategory ? selectedCategory.brands : catalogCategories.flatMap((item) => item.brands || []))
    .map((item) => item.name)
    .filter((name, index, values) => name && values.indexOf(name) === index);
  const brandsForFilter = catalogBrands.length > 0 ? catalogBrands : configuredBrands;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 12, sort: "id,asc" };
      if (q) params.q = q;
      if (category) params.category = category;
      if (brand) params.brand = brand;
      if (target) params.target = target;
      if (selectedPrice) {
        params.minPrice = selectedPrice.min;
        params.maxPrice = selectedPrice.max;
      }
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
  }, [page, q, category, brand, target, selectedPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    productApi.getNavigation()
      .then((response) => {
        const data = response.data?.data || response.data;
        if (active && Array.isArray(data?.categories)) {
          setCatalogCategories(data.categories);
        }
      })
      .catch((error) => console.error("Không thể tải danh mục sản phẩm", error));

    return () => {
      active = false;
    };
  }, []);

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

  const goToPage = (nextPage) => {
    const safePage = Math.max(0, Math.min(nextPage, totalPages - 1));
    const next = new URLSearchParams(searchParams);
    next.set("page", String(safePage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddCart = async (product) => {
    if (!user) { toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!"); return; }
    try {
      const availableColors = normalizeOptionList(product.colorOptions);
      const availableSizes = normalizeOptionList(product.sizeOptions);
      await cartApi.addToCart(product.id, 1, {
        selectedColor: availableColors[0] || "",
        selectedSize: availableSizes[0] || "",
      });
      const cartRes = await cartApi.getCart();
      setCart(cartRes.data?.data?.cartDetails || []);
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    } catch {
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  const firstVisiblePage = Math.max(0, Math.min(
    page - Math.floor(7 / 2),
    Math.max(0, totalPages - 7),
  ));
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 7) },
    (_, index) => firstVisiblePage + index,
  );

  const Sidebar = () => (
    <aside className="w-full">
      <div className="glass p-5 mb-4 border border-white/10 shadow-glass">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400" style={{ fontSize: 20 }}>tune</span>
          Bộ lọc sản phẩm
        </h3>

        <div className="mb-5">
          <p className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">Danh mục</p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setParam("category", "")}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${!category ? "bg-white/15 text-white border border-white/10 font-semibold shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
            >
              Tất cả danh mục
            </button>
            {catalogCategories.map((item) => (
              <button
                key={item.name}
                onClick={() => setParam("category", category === item.name ? "" : item.name)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-2 ${category === item.name ? "bg-white/15 text-white border border-white/10 font-semibold shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
              >
                <span>{item.name}</span>
                <span className="text-xs text-white/40">{item.productCount}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">Thương hiệu</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setParam("brand", "")}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${!brand ? "text-white bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(22,163,74,0.3)]" : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"}`}
            >Tất cả</button>
            {brandsForFilter.map((b) => (
              <button key={b} onClick={() => setParam("brand", brand === b ? "" : b)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${brand === b ? "text-white bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(22,163,74,0.3)]" : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">Đối tượng</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("target", "")}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${!target ? "text-white bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(22,163,74,0.3)]" : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"}`}>
              Tất cả
            </button>
            {TARGETS.map((t) => (
              <button key={t} onClick={() => setParam("target", target === t ? "" : t)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${target === t ? "text-white bg-gradient-to-r from-brand-green to-brand-blue shadow-[0_0_8px_rgba(22,163,74,0.3)]" : "border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">Khoảng giá</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => setParam("price", "")}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${!priceKey ? "bg-white/15 text-white border border-white/10 font-semibold shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              Tất cả mức giá
            </button>
            {PRICE_RANGES.map((r) => (
              <button key={r.label} onClick={() => setParam("price", priceKey === r.label ? "" : r.label)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${priceKey === r.label ? "bg-white/15 text-white border border-white/10 font-semibold shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {(category || brand || target || priceKey) && (
          <button
            onClick={() => { setSearchParams({ page: "0" }); }}
            className="mt-4 w-full py-2 rounded-lg text-sm text-red-400 font-semibold hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading font-bold text-white">
                {getShopTitle({ q, category, brand })}
              </h1>
              {!loading && (
                <p className="text-white/60 text-sm mt-1">
                  {totalElements > 0 ? `${totalElements} sản phẩm` : "Không tìm thấy sản phẩm"}
                </p>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold glass"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
              Bộ lọc
            </button>
          </div>
          {sidebarOpen && <div className="md:hidden mt-4"><Sidebar /></div>}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-6">
          <div className="hidden md:block w-64 flex-shrink-0">
            <Sidebar />
          </div>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton h-72 rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-white/40" style={{ fontSize: 40 }}>search_off</span>
                </div>
                <h3 className="text-title font-bold text-white mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-white/60 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button onClick={() => setSearchParams({})} className="glass-btn-primary">Xem tất cả sản phẩm</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} onAddCart={handleAddCart} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all glass"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                    </button>
                    {visiblePages.map((p_) => {
                      const isActive = p_ === page;
                      return (
                        <button key={p_} onClick={() => goToPage(p_)}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${isActive ? "text-white shadow-[0_0_12px_rgba(22,163,74,0.4)]" : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white glass"}`}
                          style={isActive ? { background: "linear-gradient(135deg, #16a34a, #1d4ed8)" } : {}}
                        >
                          {p_ + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all glass"
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

function getShopTitle({ q, category, brand }) {
  if (q) return `Kết quả tìm kiếm: "${q}"`;
  if (category && brand) return `${category} ${brand}`;
  if (category) return category;
  if (brand) return `Sản phẩm ${brand}`;
  return "Tất cả sản phẩm";
}

function normalizeOptionList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[;,|\n\r]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
