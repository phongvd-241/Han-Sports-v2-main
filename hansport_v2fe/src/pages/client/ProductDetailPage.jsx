import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { cartApi } from "../../api/cartApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import ProductCard from "../../components/common/ProductCard";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";

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

  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    setLoading(true);
    productApi.getById(id)
      .then((res) => {
        setProduct(res.data?.data || res.data);
        return productApi.getAll({ page: 0, size: 8 });
      })
      .then((res) => {
        const all = res.data?.data?.result || [];
        setRelated(all.filter((p) => String(p.id) !== String(id)).slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const first = getFirstImage(product);
    setActiveImage(first);
  }, [product]);

  const prevImage = () => {
    if (!imagesArr || imagesArr.length === 0) return;
    const idx = imagesArr.indexOf(activeImage);
    const nextIdx = idx <= 0 ? imagesArr.length - 1 : idx - 1;
    setActiveImage(imagesArr[nextIdx]);
  };

  const nextImage = () => {
    if (!imagesArr || imagesArr.length === 0) return;
    const idx = imagesArr.indexOf(activeImage);
    const nextIdx = (idx + 1) % imagesArr.length;
    setActiveImage(imagesArr[nextIdx]);
  };



  const handleAddCart = async () => {
    if (!user) { navigate("/login"); return; }
    setAddingCart(true);
    try {
      await cartApi.addToCart(product.id, quantity);
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

  const imagesArr = product ? (
    Array.isArray(product.images) ? product.images.map(it => (typeof it === 'string' ? it : (it.imageUrl || it)))
      : (product.image ? [product.image] : [])
  ) : [];

  const imageUrl = getImageUrl(activeImage);

  return (
    <div className="min-h-screen bg-surface-soft">


      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
          <Link to="/" className="hover:text-brand-blue transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <Link to="/shop" className="hover:text-brand-blue transition-colors">Sản phẩm</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-text-primary font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Image */}
          <div className="card p-6 flex items-center justify-center flex-col gap-4" style={{ minHeight: 420 }}>
            <div className="relative w-full flex items-center justify-center">
              {imageUrl ? (
                <>
                  <button type="button" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-shadow shadow-sm">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="max-h-[420px] w-full object-contain"
                  />
                  <button type="button" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-shadow shadow-sm">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-text-muted">
                  <span className="material-symbols-outlined" style={{ fontSize: 80 }}>image_not_supported</span>
                  <p className="mt-2 text-sm">Chưa có ảnh sản phẩm</p>
                </div>
              )}
            </div>

            {imagesArr && imagesArr.length > 1 && (
              <div className="w-full flex gap-2 overflow-x-auto mt-2 px-1">
                {imagesArr.map((img, idx) => (
                  <button key={idx} type="button" onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border ${activeImage === img ? 'border-brand-blue' : 'border-surface-border'}`}>
                    <img src={getImageUrl(img)} alt={`thumb-${idx}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product.brand && (
              <span className="text-sm font-bold text-brand-teal uppercase tracking-wider">{product.brand}</span>
            )}
            <h1 className="text-display font-bold text-text-primary leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-4 border-y border-surface-border">
              <span className="text-3xl font-extrabold text-brand-blue">{formatVND(product.price)}</span>
              {product.sold > 0 && (
                <span className="text-sm text-text-muted">Đã bán: {product.sold.toLocaleString("vi-VN")}</span>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-text-secondary">Tình trạng:</span>
              {product.quantity > 0 ? (
                <span className="badge-green">Còn hàng ({product.quantity})</span>
              ) : (
                <span className="badge-danger">Hết hàng</span>
              )}
            </div>

            {/* Meta */}
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

            {/* Quantity */}
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

            {/* Actions */}
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

            {/* Trust badges */}
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

        {/* Tabs */}
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
              <div className="prose max-w-none text-text-secondary leading-relaxed">
                <p>{product.detailDesc || "Chưa có mô tả chi tiết sản phẩm."}</p>
              </div>
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

        {/* Related Products */}
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
    </div>
  );
}