import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useSettingStore } from "../../store/useSettingStore";
import ProductCard from "../../components/common/ProductCard";
import { formatVND, getImageUrl } from "../../utils/constants";
import { onSync, syncEvent } from "../../utils/sync";



function useCountdown(hours) {
  const [endTime] = useState(() => {
    const saved = localStorage.getItem("flashSaleEndTime");
    if (saved) {
      const savedTime = parseInt(saved, 10);
      // Nếu thời gian đã lưu vẫn còn hiệu lực (chưa hết hạn)
      if (savedTime > Date.now()) return savedTime;
    }
    // Nếu chưa có hoặc đã hết hạn, tạo mới
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
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const { h, m, s } = useCountdown(8);
  
  const HERO_SLIDES = getSetting("HERO_SLIDES", []);
  const CATEGORIES = getSetting("CATEGORIES", []);

  const fetchProducts = () => {
    setLoading(true);
    // Fetch 12 products to fill both Flash Sale (4) and Latest (8) sections
    productApi.getAll({ page: 0, size: 12, sort: "id,desc" })
      .then((res) => setProducts(res.data?.data?.result || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsub = onSync((event) => {
      if (event === syncEvent.PRODUCT_UPDATED) fetchProducts();
      if (event === syncEvent.SETTING_UPDATED) refreshSettings();
    });
    return unsub;
  }, []);

  const [isPaused, setIsPaused] = useState(false);
  const [dragged, setDragged] = useState(false);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1 || isPaused) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [HERO_SLIDES.length, isPaused]);

  const handleAddCart = async (product) => {
    if (!user) { toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!"); return; }
    try {
      await cartApi.addToCart(product.id, 1);
      const cartRes = await cartApi.getCart();
      setCart(cartRes.data?.data?.cartDetails || []);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch { toast.error("Thêm vào giỏ hàng thất bại!"); }
  };

  const hero = HERO_SLIDES.length > 0 ? HERO_SLIDES[heroIdx] : null;

  return (
    <div className="min-h-screen bg-surface-soft">


      {/* ── Hero Banner ── */}
      {HERO_SLIDES.length > 0 && (
      <section 
        className="relative overflow-hidden group/hero select-none touch-none"
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
            const Content = (
              <div className="w-full h-full relative overflow-hidden bg-surface-muted">
                {slide.image ? (
                  <img 
                    src={getImageUrl(slide.image)} 
                    alt="Banner" 
                    className="w-full h-full object-cover select-none pointer-events-none" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-blue-light text-brand-blue/30">
                    <span className="material-symbols-outlined" style={{ fontSize: 80 }}>image</span>
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

        {/* Navigation Arrows */}
        <button onClick={() => setHeroIdx((i) => (i > 0 ? i - 1 : HERO_SLIDES.length - 1))} 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white/20">
          <span className="material-symbols-outlined text-white">chevron_left</span>
        </button>
        <button onClick={() => setHeroIdx((i) => (i < HERO_SLIDES.length - 1 ? i + 1 : 0))} 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white/20">
          <span className="material-symbols-outlined text-white">chevron_right</span>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === heroIdx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </section>
      )}

      {/* ── Categories ── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
        <div className="section-header">
          <h2 className="text-heading font-bold text-text-primary">Danh mục sản phẩm</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(({ name, icon, path, color }) => (
            <Link key={name} to={path}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-surface-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <span className="text-xs font-semibold text-text-primary text-center">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flash Sale ── */}
      <section className="bg-white border-y border-surface-border py-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="section-header mb-0">
                <h2 className="text-heading font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-danger" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Flash Sale
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-text-muted">Kết thúc sau:</span>
                {[h, m, s].map((t, i) => (
                  <span key={i} className="bg-text-primary text-white px-2 py-1 rounded-lg font-mono text-sm">{t}</span>
                )).reduce((a, b, i) => a.length ? [...a, <span key={`sep-${i}`} className="text-text-muted font-bold">:</span>, b] : [b], [])}
              </div>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
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

      {/* ── New Products (Tabbed) ── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-brand-blue rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary uppercase tracking-tight">Sản phẩm mới</h2>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap border border-surface-border bg-white rounded-t-xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setActiveTab("all")}
            className={`flex-1 min-w-[120px] py-4 px-4 text-sm font-bold transition-all border-r border-surface-border last:border-0 ${activeTab === "all" ? "bg-gradient-to-r from-brand-green to-brand-blue text-white" : "text-text-primary hover:bg-surface-muted"}`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => setActiveTab(cat.name)}
              className={`flex-1 min-w-[120px] py-4 px-4 text-sm font-bold transition-all border-r border-surface-border last:border-0 ${activeTab === cat.name ? "bg-gradient-to-r from-brand-green to-brand-blue text-white" : "text-text-primary hover:bg-surface-muted"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid Container */}
        <div className="p-4 md:p-6 bg-white border-x-4 border-b-4 border-brand-blue/30 rounded-b-xl relative group/grid shadow-md">
          {/* Decorative top line to bridge the border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-blue/30" />

          {/* Navigation Arrows */}
          <button 
            onClick={() => {
              const el = document.getElementById("tabbed-product-scroll");
              el.scrollBy({ left: -300, behavior: "smooth" });
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-12 bg-white shadow-xl flex items-center justify-center rounded-r-xl opacity-0 group-hover/grid:opacity-100 transition-opacity z-20 border border-surface-border hover:text-brand-blue"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById("tabbed-product-scroll");
              el.scrollBy({ left: 300, behavior: "smooth" });
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-12 bg-white shadow-xl flex items-center justify-center rounded-l-xl opacity-0 group-hover/grid:opacity-100 transition-opacity z-20 border border-surface-border hover:text-brand-blue"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-64 rounded-lg" />)}
            </div>
          ) : (
            <div 
              key={activeTab}
              id="tabbed-product-scroll"
              className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar scroll-smooth py-2 px-1 animate-fade-up"
            >
              {products.length > 0 ? (
                products.filter(p => activeTab === "all" || p.category === activeTab).map((p) => (
                  <div key={p.id} className="min-w-[180px] md:min-w-[240px] max-w-[240px] bg-white rounded-2xl p-3 md:p-4 hover:shadow-[0_20px_50px_rgba(29,78,216,0.15)] hover:-translate-y-2 transition-all duration-500 group/card flex flex-col border border-surface-border hover:border-brand-blue/30 relative">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-surface-soft">
                      <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain transform group-hover/card:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2 flex-grow h-10 group-hover:text-brand-blue transition-colors">
                      {p.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-brand-blue font-black text-base md:text-lg">{formatVND(p.price)}</p>
                    </div>
                    
                    {/* Floating Add to Cart */}
                    <button 
                      onClick={() => handleAddCart(p)}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-brand-green to-brand-blue text-white text-xs font-black rounded-xl opacity-0 group-hover/card:opacity-100 transition-all transform translate-y-4 group-hover/card:translate-y-0 shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_shopping_cart</span>
                      THÊM VÀO GIỎ
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-text-muted italic flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl opacity-20">inventory_2</span>
                  Chưa có sản phẩm nào trong danh mục này.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="bg-gradient-to-r from-brand-green to-brand-blue py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          {[
            { icon: "verified_user", title: "Hàng chính hãng 100%", desc: "Cam kết từ nhà phân phối" },
            { icon: "local_shipping", title: "Giao hàng toàn quốc", desc: "1-3 ngày làm việc" },
            { icon: "support_agent", title: "Hỗ trợ 7/7", desc: "Tư vấn miễn phí" },
            { icon: "cached", title: "Đổi trả 30 ngày", desc: "Hoàn tiền nếu lỗi hãng" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-white/75 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
