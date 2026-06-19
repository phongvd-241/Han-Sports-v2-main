import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import ProductCard from "../../components/common/ProductCard";
import ProductDescription from "../../components/common/ProductDescription";
import SafeImage from "../../components/common/SafeImage";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";

function normalizeOptionList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[;,|\n\r]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function toSearchSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeDecodeUrl(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function imageMatchesColor(image, color) {
  const colorSlug = toSearchSlug(color);
  if (!colorSlug) return false;
  const imageSlug = toSearchSlug(safeDecodeUrl(String(image || "").split("?")[0]));
  return new RegExp(`${escapeRegex(colorSlug)}(?:$|-[0-9])`).test(imageSlug);
}

function getGalleryImagesForColor(images, color) {
  const matchedImages = images.filter((image) => imageMatchesColor(image, color));
  return matchedImages.length > 0 ? matchedImages : images;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCart } = useCartStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const [cartState, setCartState] = useState("idle"); // "idle" | "loading" | "success"
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const imageVersion = product?.updatedAt || product?.createdAt || product?.id;
  const imagesArr = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.images)
      ? product.images.map((item) => (typeof item === "string" ? item : (item.imageUrl || item)))
      : (product.image ? [product.image] : []);
  }, [product]);
  const colorOptions = useMemo(() => normalizeOptionList(product?.colorOptions), [product?.colorOptions]);
  const sizeOptions = useMemo(() => normalizeOptionList(product?.sizeOptions), [product?.sizeOptions]);
  const galleryImages = useMemo(
    () => getGalleryImagesForColor(imagesArr, selectedColor),
    [imagesArr, selectedColor]
  );

  useEffect(() => {
    setLoading(true);
    productApi.getById(id)
      .then((res) => {
        const prod = res.data?.data || res.data;
        setProduct(prod);

        const brand = prod?.brand;
        if (brand) {
          return Promise.all([
            Promise.resolve(prod),
            productApi.getAll({ page: 0, size: 8, brand }),
            productApi.getAll({ page: 0, size: 8 })
          ]);
        } else {
          return Promise.all([
            Promise.resolve(prod),
            productApi.getAll({ page: 0, size: 8 }),
            Promise.resolve(null)
          ]);
        }
      })
      .then(([, brandRes, generalRes]) => {
        const brandProducts = brandRes?.data?.data?.result || brandRes?.data?.result || [];
        const generalProducts = generalRes ? (generalRes?.data?.data?.result || generalRes?.data?.result || []) : [];

        // Filter out current product
        const filteredBrand = brandProducts.filter((p) => String(p.id) !== String(id));
        const filteredGeneral = generalProducts.filter((p) => String(p.id) !== String(id));

        // Combine same-brand products first, then fill with general products
        const combined = [...filteredBrand];
        for (const p of filteredGeneral) {
          if (combined.length >= 4) break;
          if (!combined.some(existing => String(existing.id) === String(p.id))) {
            combined.push(p);
          }
        }

        setRelated(combined.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const first = getFirstImage(product);
    setActiveImage(first);
    const colors = normalizeOptionList(product.colorOptions);
    const sizes = normalizeOptionList(product.sizeOptions);
    setSelectedColor(colors[0] || "");
    setSelectedSize(sizes[0] || "");
  }, [product]);

  useEffect(() => {
    if (!product || galleryImages.length === 0) return;
    if (!galleryImages.includes(activeImage)) {
      setActiveImage(galleryImages[0]);
    }
  }, [activeImage, galleryImages, product]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const prevImage = () => {
    if (!galleryImages || galleryImages.length === 0) return;
    const idx = galleryImages.indexOf(activeImage);
    const nextIdx = idx <= 0 ? galleryImages.length - 1 : idx - 1;
    setActiveImage(galleryImages[nextIdx]);
  };

  const nextImage = () => {
    if (!galleryImages || galleryImages.length === 0) return;
    const idx = galleryImages.indexOf(activeImage);
    const nextIdx = (idx + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIdx]);
  };



  const handleAddCart = async () => {
    if (!user) { navigate("/login"); return; }
    if (cartState !== "idle") return;
    setCartState("loading");
    const startTime = Date.now();
    try {
      const availableColors = normalizeOptionList(product?.colorOptions);
      const availableSizes = normalizeOptionList(product?.sizeOptions);
      await cartApi.addToCart(product.id, quantity, {
        selectedColor: selectedColor || availableColors[0] || "",
        selectedSize: selectedSize || availableSizes[0] || "",
      });
      const cartRes = await cartApi.getCart();
      setCart(cartRes.data?.data?.cartDetails || []);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(500 - elapsedTime, 0);
      setTimeout(() => {
        setCartState("success");
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        setTimeout(() => setCartState("idle"), 1800);
      }, remainingTime);
    } catch {
      setCartState("idle");
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  const handleBuyNow = async () => {
    if (!user) { navigate("/login"); return; }
    await handleAddCart();
    navigate("/cart");
  };

  if (loading) return (
    <div className="min-h-screen bg-transparent py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="skeleton bg-white/5 rounded-2xl" style={{ height: 480 }} />
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton bg-white/5 rounded-lg h-8" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-white/30" style={{ fontSize: 64 }}>error_outline</span>
        <p className="text-title font-bold mt-4 text-white">Không tìm thấy sản phẩm</p>
        <Link to="/shop" className="glass-btn-primary mt-6 inline-flex">Quay lại cửa hàng</Link>
      </div>
    </div>
  );

  const imageUrl = getImageUrl(activeImage, "product", imageVersion);
  const originalPrice = Number(product.originalPrice || 0);
  const hasSalePrice = originalPrice > Number(product.price || 0);
  const salePercent = hasSalePrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
          <Link to="/" className="hover:text-green-400 transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <Link to="/shop" className="hover:text-green-400 transition-colors">Sản phẩm</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-white font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] xl:grid-cols-[450px_1fr_180px] gap-8 xl:gap-10 mb-12">
          <div className="glass p-4 md:p-6 shadow-glass relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="relative w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,199,102,0.12),transparent_60%)] pointer-events-none" />
                {imageUrl ? (
                  <>
                    {galleryImages.length > 1 && (
                      <button type="button" onClick={prevImage} aria-label="Ảnh trước" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 text-white transition-all shadow-md">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                    )}
                    <div onClick={() => setIsLightboxOpen(true)} className="absolute inset-0 cursor-zoom-in flex items-center justify-center">
                      <SafeImage
                        src={imageUrl}
                        alt={product.name}
                        className="max-w-[90%] max-h-[90%] object-contain p-2"
                        fallbackClassName="absolute inset-0"
                        loading="eager"
                      />
                    </div>
                    {galleryImages.length > 1 && (
                      <button type="button" onClick={nextImage} aria-label="Ảnh tiếp theo" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 text-white transition-all shadow-md">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-white/40">
                    <span className="material-symbols-outlined" style={{ fontSize: 80 }}>image_not_supported</span>
                    <p className="mt-2 text-sm">Chưa có ảnh sản phẩm</p>
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex flex-row gap-2 overflow-x-auto hide-scrollbar w-full py-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      aria-label={`Xem ảnh ${idx + 1}`}
                      className={`w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 border bg-white/5 transition-all ${
                        activeImage === img ? "border-green-400 ring-2 ring-green-400/20" : "border-white/15 hover:border-white/35"
                      }`}
                    >
                      <SafeImage
                        src={getImageUrl(img, "product", imageVersion)}
                        alt={`Ảnh ${idx + 1} của ${product.name}`}
                        className="w-full h-full object-contain p-1.5"
                        fallbackClassName="w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {product.brand && (
              <span className="text-sm font-bold text-green-400 uppercase tracking-wider">{product.brand}</span>
            )}
            <h1 className="text-display font-bold text-white leading-tight">{product.name}</h1>

            <div className="flex flex-wrap items-baseline gap-3 py-4 border-y border-white/10">
              <span className={`${hasSalePrice ? "text-red-400" : "text-blue-400"} text-3xl font-extrabold`}>{formatVND(product.price)}</span>
              {hasSalePrice && (
                <>
                  <span className="text-sm text-white/40">Giá niêm yết:</span>
                  <span className="text-sm text-white/40 line-through">{formatVND(originalPrice)}</span>
                  <span className="glass-badge bg-red-500/20 text-red-300 border border-red-500/30">-{salePercent}%</span>
                </>
              )}
              {product.sold > 0 && (
                <span className="text-sm text-white/50 ml-auto">Đã bán: {product.sold.toLocaleString("vi-VN")}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white/70">Tình trạng:</span>
              {product.quantity > 0 ? (
                <span className="glass-badge bg-green-500/20 text-green-300 border border-green-500/30">Còn hàng ({product.quantity})</span>
              ) : (
                <span className="glass-badge bg-red-500/20 text-red-300 border border-red-500/30">Hết hàng</span>
              )}
            </div>

            {(product.target || product.brand) && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Đối tượng", value: product.target, icon: "person" },
                  { label: "Thương hiệu", value: product.brand, icon: "verified" },
                ].filter((m) => m.value).map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-2.5 glass-card px-3 py-2">
                    <span className="material-symbols-outlined text-green-400" style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <p className="text-xs text-white/50">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {colorOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white/70 mb-2">Chọn màu sắc:</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color, index) => {
                    const isSelected = selectedColor === color;
                    const previewImage = getGalleryImagesForColor(imagesArr, color)[0] || imagesArr[index] || activeImage;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          const nextGallery = getGalleryImagesForColor(imagesArr, color);
                          if (nextGallery[0]) setActiveImage(nextGallery[0]);
                        }}
                        className={`min-w-[132px] rounded-lg border p-2 text-left transition-all ${
                          isSelected
                            ? "bg-white/15 border-green-400 ring-2 ring-green-400/20 shadow-glass"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-md bg-white/5 overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={getImageUrl(previewImage, "product", imageVersion)}
                              alt={color}
                              className="w-full h-full object-contain p-1"
                              fallbackClassName="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs text-white">
                              <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                isSelected ? "bg-green-500 border-green-500" : "border-white/20"
                              }`}>
                                {isSelected && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                              </span>
                              <span className="truncate">{color}</span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-red-400">{formatVND(product.price)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white/70 mb-2">Chọn size:</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                          isSelected
                            ? "border-green-400 bg-white/15 text-white"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-white/30"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-green-500 text-white" : "border border-white/20"
                        }`}>
                          {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>}
                        </span>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.quantity > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white/70">Số lượng:</span>
                <div className="flex items-center border border-white/15 bg-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/70 hover:bg-white/10 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                  </button>
                  <span className="w-12 text-center font-semibold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/70 hover:bg-white/10 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleAddCart}
                disabled={cartState !== "idle" || product.quantity === 0}
                className={`flex-1 py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  product.quantity === 0
                    ? "bg-white/5 border-white/10 text-white/30"
                    : cartState === "loading"
                    ? "bg-white/10 text-white/50 border border-white/10 cursor-wait"
                    : cartState === "success"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[1.02]"
                    : "bg-white/5 border-white/20 text-white hover:bg-white/15"
                }`}
              >
                {cartState === "loading" ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang thêm...</span>
                  </>
                ) : cartState === "success" ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                    <span>Đã thêm! (✓)</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_shopping_cart</span>
                    <span>Thêm vào giỏ</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.quantity === 0}
                className="flex-1 glass-btn-primary py-3.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                Mua ngay
              </button>
            </div>

            {/* On screens smaller than xl, show horizontal benefits at the bottom of column 2 */}
            <div className="xl:hidden grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 mt-6">
              {[
                { icon: "shield", text: "Chính hãng", desc: "Cam kết 100%" },
                { icon: "sync", text: "Đổi trả", desc: "Trong 30 ngày" },
                { icon: "local_shipping", text: "Giao hàng", desc: "Toàn quốc" },
                { icon: "headset", text: "Hỗ trợ 24/7", desc: "Tư vấn miễn phí" },
              ].map(({ icon, text, desc }) => (
                <div key={text} className="flex items-center gap-3 p-3 glass-card bg-white/40 border border-white/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#82c5f9] to-[#2a94f6] border border-white flex items-center justify-center text-white shadow-[0_2px_6px_rgba(42,148,246,0.2)] flex-shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{text}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Vertical benefits on the right, visible only on xl screens */}
          <div className="hidden xl:flex flex-col items-center justify-around py-12 px-4 glass bg-white/45 border border-white/50 rounded-[50px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] w-[180px] h-[520px] self-start">
            {[
              { icon: "shield", title: "Chính hãng", desc: "" },
              { icon: "sync", title: "Đổi trả", desc: "30 ngày" },
              { icon: "local_shipping", title: "Giao hàng", desc: "toàn quốc" },
              { icon: "headset", title: "Hỗ trợ 24/7", desc: "" },
            ].map(({ icon, title, desc }, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-1.5 w-full">
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#82c5f9] to-[#2a94f6] border-2 border-white flex items-center justify-center text-white shadow-[0_4px_10px_rgba(42,148,246,0.25)] transition-transform duration-300 hover:scale-110 cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <div className="flex flex-col items-center leading-tight">
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  {desc && <p className="text-xs text-slate-500 font-medium mt-0.5">{desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass mb-12 shadow-glass border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10 bg-white/5">
            {["description", "specs", "reviews"].map((tab) => {
              const labels = { description: "Mô tả sản phẩm", specs: "Thông số kỹ thuật", reviews: "Đánh giá" };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${isActive ? "border-green-400 text-white font-bold" : "border-transparent text-white/60 hover:text-white"}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
          <div className="p-8">
            {activeTab === "description" && (
              <ProductDescription content={product.detailDesc} />
            )}
            {activeTab === "specs" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Tên sản phẩm", product.name],
                  ["Thương hiệu", product.brand],
                  ["Đối tượng", product.target],
                  ["Mô tả ngắn", product.shortDesc],
                  ["Tồn kho", product.quantity],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm font-semibold text-white/60 w-32 flex-shrink-0">{k}:</span>
                    <span className="text-sm text-white">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center py-8 text-white/40">
                <span className="material-symbols-outlined" style={{ fontSize: 48 }}>rate_review</span>
                <p className="mt-3 font-semibold">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <div className="section-header">
              <h2 className="text-heading font-bold text-white">Sản phẩm liên quan</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} onAddCart={handleAddCart} />)}
            </div>
          </div>
        )}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none">
          <div className="w-full flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent text-white z-10">
            <div className="text-sm font-semibold">{galleryImages.indexOf(activeImage) + 1} / {galleryImages.length}</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRotation(r => r - 90)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">rotate_left</span>
              </button>
              <button type="button" onClick={() => setRotation(r => r + 90)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">rotate_right</span>
              </button>
              <button type="button" onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button type="button" onClick={() => setZoomScale(s => Math.min(4, s + 0.25))} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button type="button" onClick={() => { setZoomScale(1); setRotation(0); }} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
              <button type="button" onClick={() => setIsLightboxOpen(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0" onClick={() => setIsLightboxOpen(false)} />

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevImage(); setZoomScale(1); setRotation(0); }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            )}

            <div className="max-w-[85vw] max-h-[80vh] flex items-center justify-center transition-transform duration-200" style={{ transform: `scale(${zoomScale}) rotate(${rotation}deg)` }}>
              <img
                src={getImageUrl(activeImage, "product", imageVersion)}
                alt={product.name}
                className="max-w-full max-h-[80vh] object-contain pointer-events-none"
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextImage(); setZoomScale(1); setRotation(0); }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            )}
          </div>

          <div className="w-full text-center py-4 bg-gradient-to-t from-black/50 to-transparent text-white/70 text-xs">
            Bấm bên ngoài để đóng. Sử dụng các nút trên thanh công cụ để xoay hoặc thu phóng.
          </div>
        </div>
      )}
    </div>
  );
}
