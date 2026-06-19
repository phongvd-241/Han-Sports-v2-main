import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import ProductCard from "../../components/common/ProductCard";
import SafeImage from "../../components/common/SafeImage";
import { formatVND, getImageUrl, getFirstImage } from "../../utils/constants";
import { onSync, syncEvent } from "../../utils/sync";



function useCountdown(hours) {
  const [endTime] = useState(() => {
    const saved = localStorage.getItem("flashSaleEndTime");
    if (saved) {
      const savedTime = parseInt(saved, 10);
      if (savedTime > Date.now()) return savedTime;
    }
    const newEnd = Date.now() + hours * 3600000;
    localStorage.setItem("flashSaleEndTime", newEnd.toString());
    return newEnd;
  });

  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearInterval(t);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const h = Math.floor(timeLeft / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);
  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { setCart } = useCartStore();
  const { getSetting, refreshSettings } = useSettingStore();
  const [products, setProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("");
  const { h, m, s } = useCountdown(8);

  const HERO_SLIDES = getSetting("HERO_SLIDES", []).filter((slide) => slide.active !== false);
  const configuredCategories = getSetting("CATEGORIES", []).filter((category) => category.active !== false);
  const displayCategories = useMemo(
    () => buildDisplayCategories(catalogGroups, configuredCategories),
    [catalogGroups, configuredCategories],
  );

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productApi.getAll({ page: 0, size: 12, sort: "id,desc" })
      .then((res) => setProducts(res.data?.data?.result || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchNavigation = useCallback(() => {
    productApi.getNavigation()
      .then((response) => {
        const data = response.data?.data || response.data;
        setCatalogGroups(Array.isArray(data?.categories) ? data.categories : []);
      })
      .catch((error) => console.error("Không thể tải danh mục sản phẩm", error));
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchNavigation();
  }, [fetchNavigation, fetchProducts]);

  useEffect(() => {
    const categoryNames = catalogGroups.map((group) => group.name);
    if (categoryNames.length > 0 && !categoryNames.includes(activeTab)) {
      setActiveTab(categoryNames[0]);
    }
  }, [activeTab, catalogGroups]);

  useEffect(() => {
    if (!activeTab) {
      setCategoryProducts([]);
      setCategoryLoading(false);
      return;
    }

    let active = true;
    setCategoryLoading(true);
    productApi.getAll({ page: 0, size: 12, sort: "id,desc", category: activeTab })
      .then((response) => {
        if (active) {
          setCategoryProducts(response.data?.data?.result || []);
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) setCategoryProducts([]);
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab]);

  useEffect(() => {
    const unsub = onSync((event) => {
      if (event === syncEvent.PRODUCT_UPDATED) fetchProducts();
      if (event === syncEvent.PRODUCT_UPDATED) fetchNavigation();
      if (event === syncEvent.SETTING_UPDATED) refreshSettings();
    });
    return unsub;
  }, [fetchNavigation, fetchProducts, refreshSettings]);

  const [isPaused, setIsPaused] = useState(false);
  const [dragged, setDragged] = useState(false);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1 || isPaused) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [HERO_SLIDES.length, isPaused]);

  useEffect(() => {
    if (heroIdx >= HERO_SLIDES.length) setHeroIdx(0);
  }, [HERO_SLIDES.length, heroIdx]);

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
      toast.success("Đã thêm vào giỏ hàng!");
    } catch { toast.error("Thêm vào giỏ hàng thất bại!"); }
  };

  return (
    <div className="min-h-screen bg-transparent">


      {HERO_SLIDES.length > 0 && (
        <section
          className="relative overflow-hidden group/hero select-none touch-none max-w-[1280px] mx-auto md:my-6 md:rounded-3xl border border-white/10 shadow-glass"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${heroIdx * 100}%)` }}
            onPointerDown={(e) => {
              const startX = e.clientX;
              setIsPaused(true);
              setDragged(false);
              const handleMove = (moveEvent) => {
                const diff = moveEvent.clientX - startX;
                if (Math.abs(diff) > 10) setDragged(true);
                if (Math.abs(diff) > 100) {
                  if (diff > 0) setHeroIdx((i) => (i > 0 ? i - 1 : HERO_SLIDES.length - 1));
                  else setHeroIdx((i) => (i < HERO_SLIDES.length - 1 ? i + 1 : 0));
                  cleanup();
                }
              };
              const cleanup = () => {
                setIsPaused(false);
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", cleanup);
              };
              window.addEventListener("pointermove", handleMove);
              window.addEventListener("pointerup", cleanup);
            }}
          >
            {HERO_SLIDES.map((slide, i) => {
              const bannerImage = getFirstImage(slide);
              const Content = (
                <div className="w-full h-full relative overflow-hidden bg-transparent">
                  {bannerImage ? (
                    <SafeImage
                      src={getImageUrl(bannerImage, slide.imageFolder || "banner")}
                      alt={`Banner ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      fallbackClassName="absolute inset-0 w-full h-full bg-white/5"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                      <span className="material-symbols-outlined" style={{ fontSize: 56 }}>image_not_supported</span>
                      <span className="mt-2 text-sm font-semibold">Banner chưa có ảnh</span>
                    </div>
                  )}
                </div>
              );

              return (
                <div key={i} className="min-w-full h-[250px] md:h-[450px] lg:h-[550px]">
                  {slide.ctaLink ? (
                    <Link
                      to={slide.ctaLink}
                      className="block w-full h-full cursor-pointer"
                      onClick={(e) => { if (dragged) e.preventDefault(); }}
                    >
                      {Content}
                    </Link>
                  ) : Content}
                </div>
              );
            })}
          </div>

          <button onClick={() => setHeroIdx((i) => (i > 0 ? i - 1 : HERO_SLIDES.length - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white/20">
            <span className="material-symbols-outlined text-white">chevron_left</span>
          </button>
          <button onClick={() => setHeroIdx((i) => (i < HERO_SLIDES.length - 1 ? i + 1 : 0))}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white/20">
            <span className="material-symbols-outlined text-white">chevron_right</span>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === heroIdx ? "w-6 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
        <div className="section-header">
          <h2 className="text-heading font-bold text-white">Danh mục sản phẩm</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {displayCategories.map(({ name, icon, path, color }) => {
            const glassColor = color
              .replace("bg-brand-blue-light text-brand-blue", "bg-blue-500/20 text-blue-300 border border-blue-500/30")
              .replace("bg-brand-green-light text-brand-green", "bg-green-500/20 text-green-300 border border-green-500/30")
              .replace("bg-brand-teal-light text-brand-teal", "bg-teal-500/20 text-teal-300 border border-teal-500/30");
            return (
              <Link key={name} to={path}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl glass-card hover:-translate-y-1.5 transition-all duration-300 group h-full"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${glassColor} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <span className="text-xs font-semibold text-white/90 text-center group-hover:text-green-300 transition-colors">{name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="glass max-w-[1280px] mx-auto px-6 py-12 my-12 border border-white/10 rounded-3xl shadow-glass">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="section-header mb-0">
                <h2 className="text-heading font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 shadow-glass" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Flash Sale
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-white/60">Kết thúc sau:</span>
                {[h, m, s].map((t, i) => (
                  <span key={i} className="glass-dark border border-white/15 text-white px-2.5 py-1 rounded-lg font-mono text-sm shadow-[0_0_10px_rgba(0,0,0,0.2)]">{t}</span>
                )).reduce((a, b, i) => a.length ? [...a, <span key={`sep-${i}`} className="text-white/40 font-bold">:</span>, b] : [b], [])}
              </div>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton bg-white/5 h-72 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} discountPercent={[15, 20, 10, 25][i % 4]} onAddCart={handleAddCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-blue-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">Sản phẩm mới</h2>
        </div>

        <div className="flex flex-wrap border border-white/10 bg-white/5 rounded-t-2xl overflow-hidden shadow-glass">
          {displayCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(cat.name)}
              className={`flex-1 min-w-[120px] py-4 px-4 text-sm font-bold transition-all border-r border-white/10 last:border-0 ${activeTab === cat.name ? "bg-gradient-to-r from-brand-green to-brand-blue text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 glass border-x border-b border-white/10 rounded-b-2xl relative group/grid shadow-glass">
          <button
            onClick={() => {
              const el = document.getElementById("tabbed-product-scroll");
              el.scrollBy({ left: -300, behavior: "smooth" });
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-12 glass-dark border border-white/15 shadow-xl flex items-center justify-center rounded-r-xl opacity-0 group-hover/grid:opacity-100 transition-opacity z-20 hover:bg-white/10 text-white"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("tabbed-product-scroll");
              el.scrollBy({ left: 300, behavior: "smooth" });
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-12 glass-dark border border-white/15 shadow-xl flex items-center justify-center rounded-l-xl opacity-0 group-hover/grid:opacity-100 transition-opacity z-20 hover:bg-white/10 text-white"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {categoryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton bg-white/5 h-64 rounded-lg" />)}
            </div>
          ) : (
            <div
              key={activeTab}
              id="tabbed-product-scroll"
              className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar scroll-smooth py-2 px-1 animate-fade-up"
            >
              {categoryProducts.length > 0 ? (
                categoryProducts.map((p) => (
                  <div key={p.id} className="min-w-[180px] md:min-w-[240px] max-w-[240px] glass-card p-3 md:p-4 hover:-translate-y-2 transition-all duration-500 group/card flex flex-col relative">
                    <Link to={`/products/${p.id}`} className="flex flex-col flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl">
                      <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-white/5 border border-white/10">
                        {getFirstImage(p) ? (
                          <img
                            src={getImageUrl(getFirstImage(p))}
                            alt={p.name}
                            className="w-full h-full object-contain transform group-hover/card:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>image_not_supported</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 flex-grow h-10 group-hover/card:text-green-300 transition-colors">
                        {p.name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-blue-400 font-extrabold text-base md:text-lg">{formatVND(p.price)}</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleAddCart(p)}
                      className="mt-4 w-full py-3 glass-btn-primary text-xs font-black rounded-xl opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-all transform md:translate-y-4 group-hover/card:translate-y-0 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_shopping_cart</span>
                      THÊM VÀO GIỎ
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-white/40 italic flex flex-col items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-4xl opacity-20">inventory_2</span>
                  Chưa có sản phẩm nào trong danh mục này.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="glass bg-white/45 border border-white/50 backdrop-blur-md py-14 max-w-[1280px] mx-auto rounded-3xl shadow-glass my-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: "shield", title: "Hàng chính hãng 100%", desc: "Cam kết từ nhà phân phối" },
            { icon: "local_shipping", title: "Giao hàng toàn quốc", desc: "1-3 ngày làm việc" },
            { icon: "headset", title: "Hỗ trợ 7/7", desc: "Tư vấn miễn phí" },
            { icon: "sync", title: "Đổi trả 30 ngày", desc: "Hoàn tiền nếu lỗi hãng" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#82c5f9] to-[#2a94f6] border-2 border-white flex items-center justify-center text-white shadow-[0_4px_10px_rgba(42,148,246,0.25)] transition-transform duration-300 hover:scale-110">
                <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800">{title}</h3>
              <p className="text-slate-500 text-xs font-semibold">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildDisplayCategories(catalogGroups, configuredCategories) {
  if (catalogGroups.length === 0) {
    return configuredCategories;
  }

  return catalogGroups.map((group, index) => {
    const configured = configuredCategories.find(
      (category) => category.name?.trim().toLowerCase() === group.name.trim().toLowerCase(),
    );
    return {
      name: group.name,
      productCount: group.productCount,
      icon: configured?.icon || categoryIcon(group.name),
      color: configured?.color || categoryColor(index),
      path: productCategoryPath(group.name),
    };
  });
}

function productCategoryPath(category) {
  return `/shop?${new URLSearchParams({ category }).toString()}`;
}

function categoryIcon(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("vợt")) return "sports_tennis";
  if (normalized.includes("balo")) return "backpack";
  if (normalized.includes("túi")) return "shopping_bag";
  if (normalized.includes("giày")) return "footprint";
  if (normalized.includes("áo") || normalized.includes("quần")) return "dry_cleaning";
  return "category";
}

function categoryColor(index) {
  return [
    "bg-brand-blue-light text-brand-blue",
    "bg-brand-green-light text-brand-green",
    "bg-brand-teal-light text-brand-teal",
  ][index % 3];
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
