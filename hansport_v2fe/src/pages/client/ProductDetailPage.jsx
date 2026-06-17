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

  const [addingCart, setAddingCart] = useState(false);
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
    setAddingCart(true);
    try {
      const availableColors = normalizeOptionList(product?.colorOptions);
      const availableSizes = normalizeOptionList(product?.sizeOptions);
      await cartApi.addToCart(product.id, quantity, {
        selectedColor: selectedColor || availableColors[0] || "",
        selectedSize: selectedSize || availableSizes[0] || "",
      });
      const cartRes = await cartApi.getCart();
      setCart(cartRes.data?.data?.cartDetails || []);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch {
      toast.error("Thêm vào giỏ hàng thất bại!");
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) { navigate("/login"); return; }
    await handleAddCart();
    navigate("/cart");
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-soft py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="skeleton rounded-2xl" style={{ height: 480 }} />
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-lg h-8" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 64 }}>error_outline</span>
        <p className="text-title font-bold mt-4">Không tìm thấy sản phẩm</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">Quay lại cửa hàng</Link>
      </div>
    </div>
  );

  const imageUrl = getImageUrl(activeImage, "product", imageVersion);
  const originalPrice = Number(product.originalPrice || 0);
  const hasSalePrice = originalPrice > Number(product.price || 0);
  const salePercent = hasSalePrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
          <Link to="/" className="hover:text-brand-blue transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <Link to="/shop" className="hover:text-brand-blue transition-colors">Sản phẩm</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-text-primary font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 mb-12">
          <div className="card p-4 md:p-6">
            <div className="flex flex-col gap-4">
              <div className="relative w-full aspect-square rounded-lg bg-white flex items-center justify-center overflow-hidden border border-surface-border/50">
                {imageUrl ? (
                  <>
                    {galleryImages.length > 1 && (
                      <button type="button" onClick={prevImage} aria-label="Ảnh trước" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-card">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                    )}
                    <div onClick={() => setIsLightboxOpen(true)} className="absolute inset-0 cursor-zoom-in">
                      <SafeImage
                        src={imageUrl}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-contain p-2"
                        fallbackClassName="absolute inset-0"
                        loading="eager"
                      />
                    </div>
                    {galleryImages.length > 1 && (
                      <button type="button" onClick={nextImage} aria-label="Ảnh tiếp theo" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-card">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-text-muted">
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
                      className={`w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 border-2 bg-white transition-colors ${
                        activeImage === img ? "border-brand-blue" : "border-surface-border hover:border-brand-blue/50"
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
              <span className="text-sm font-bold text-brand-teal uppercase tracking-wider">{product.brand}</span>
            )}
            <h1 className="text-display font-bold text-text-primary leading-tight">{product.name}</h1>

            <div className="flex flex-wrap items-baseline gap-3 py-4 border-y border-surface-border">
              <span className={`${hasSalePrice ? "text-danger" : "text-brand-blue"} text-3xl font-extrabold`}>{formatVND(product.price)}</span>
              {hasSalePrice && (
                <>
                  <span className="text-sm text-text-muted">Giá niêm yết:</span>
                  <span className="text-sm text-text-muted line-through">{formatVND(originalPrice)}</span>
                  <span className="badge-danger">-{salePercent}%</span>
                </>
              )}
              {product.sold > 0 && (
                <span className="text-sm text-text-muted">Đã bán: {product.sold.toLocaleString("vi-VN")}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-secondary">Tình trạng:</span>
              {product.quantity > 0 ? (
                <span className="badge-green">Còn hàng ({product.quantity})</span>
              ) : (
                <span className="badge-danger">Hết hàng</span>
              )}
            </div>

            {(product.target || product.brand) && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Đối tượng", value: product.target, icon: "person" },
                  { label: "Thương hiệu", value: product.brand, icon: "verified" },
                ].filter((m) => m.value).map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-2.5 bg-surface-muted rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <p className="text-xs text-text-muted">{label}</p>
                      <p className="text-sm font-semibold text-text-primary">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {colorOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-text-secondary mb-2">Chọn màu sắc:</p>
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
                        className={`min-w-[132px] rounded-lg border bg-white p-2 text-left transition-all ${
                          isSelected
                            ? "border-brand-blue ring-2 ring-brand-blue/10 shadow-card"
                            : "border-surface-border hover:border-brand-blue/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-md bg-surface-soft overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={getImageUrl(previewImage, "product", imageVersion)}
                              alt={color}
                              className="w-full h-full object-contain p-1"
                              fallbackClassName="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs text-text-primary">
                              <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                isSelected ? "bg-brand-green border-brand-green" : "border-surface-border"
                              }`}>
                                {isSelected && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                              </span>
                              <span className="truncate">{color}</span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-danger">{formatVND(product.price)}</p>
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
                <p className="text-sm font-semibold text-text-secondary mb-2">Chọn size:</p>
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
                            ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                            : "border-surface-border bg-white text-text-secondary hover:border-brand-blue/60"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-brand-green text-white" : "border border-surface-border"
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
                <span className="text-sm font-semibold text-text-secondary">Số lượng:</span>
                <div className="flex items-center border border-surface-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface-muted transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                  </button>
                  <span className="w-12 text-center font-semibold text-text-primary">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface-muted transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleAddCart}
                disabled={addingCart || product.quantity === 0}
                className="flex-1 py-3.5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-sm hover:bg-brand-blue-light transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_shopping_cart</span>
                {addingCart ? "Đang thêm..." : "Thêm vào giỏ"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.quantity === 0}
                className="flex-1 btn-primary py-3.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mua ngay
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-surface-border">
              {[
                { icon: "verified_user", text: "Hàng chính hãng 100%" },
                { icon: "local_shipping", text: "Giao hàng toàn quốc" },
                { icon: "cached", text: "Đổi trả 30 ngày" },
                { icon: "support_agent", text: "Hỗ trợ 7/7" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 16 }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-12">
          <div className="flex border-b border-surface-border">
            {["description", "specs", "reviews"].map((tab) => {
              const labels = { description: "Mô tả sản phẩm", specs: "Thông số kỹ thuật", reviews: "Đánh giá" };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${isActive ? "border-brand-blue text-brand-blue" : "border-transparent text-text-secondary hover:text-brand-blue"}`}
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
                  <div key={k} className="flex gap-3 p-3 bg-surface-muted rounded-lg">
                    <span className="text-sm font-semibold text-text-secondary w-32 flex-shrink-0">{k}:</span>
                    <span className="text-sm text-text-primary">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center py-8 text-text-muted">
                <span className="material-symbols-outlined" style={{ fontSize: 48 }}>rate_review</span>
                <p className="mt-3 font-semibold">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <div className="section-header">
              <h2 className="text-heading font-bold text-text-primary">Sản phẩm liên quan</h2>
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
