import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "../../api/cartApi";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cartItems, setCart, removeItem, getTotal, selectedIds, toggleSelect, selectAll } = useCartStore();
  const { getSetting } = useSettingStore();
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    cartApi.getCart()
      .then((res) => {
        const items = res.data?.data?.cartDetails || res.data?.data || [];
        setCart(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (itemId) => {
    setRemoving(itemId);
    try {
      await cartApi.removeFromCart(itemId);
      removeItem(itemId);
    } catch (e) { console.error(e); }
    finally { setRemoving(null); }
  };

  const handleQuantityChange = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    const maxQty = item.product?.quantity ?? 999;
    if (newQty < 1 || newQty > maxQty) return;

    setUpdating(item.id);
    try {
      // Remove old + add new with updated quantity
      await cartApi.removeFromCart(item.id);
      const addRes = await cartApi.addToCart(item.product?.id || item.productId, newQty);
      // Reload cart to get updated IDs
      const cartRes = await cartApi.getCart();
      const items = cartRes.data?.data?.cartDetails || cartRes.data?.data || [];
      setCart(items);
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const subtotal = getTotal();
  const freeShipLimit = parseInt(getSetting("FREE_SHIP_LIMIT", "500000"), 10);
  const baseShippingFee = parseInt(getSetting("SHIPPING_FEE", "30000"), 10);
  const shipping = cartItems.length > 0 && subtotal < freeShipLimit ? baseShippingFee : 0;
  const total = subtotal + shipping;

  if (loading) return (
    <div className="min-h-screen bg-surface-soft py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="skeleton h-10 rounded-xl w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-full bg-brand-blue-light flex items-center justify-center mb-6 animate-float">
        <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 48 }}>shopping_cart</span>
      </div>
      <h2 className="text-title font-bold text-text-primary mb-2">Giỏ hàng trống</h2>
      <p className="text-text-muted mb-8 text-lg">Hãy thêm sản phẩm yêu thích vào giỏ hàng ngay!</p>
      <Link to="/shop" className="btn-primary py-3.5 px-10 rounded-xl shadow-blue-glow hover:scale-105 transition-transform">
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>storefront</span>
        Khám phá sản phẩm
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-soft py-10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-heading font-bold text-text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-brand-blue" style={{ fontSize: 32 }}>shopping_cart</span>
            Giỏ hàng của bạn
            <span className="ml-1 px-2.5 py-0.5 rounded-pill text-sm font-bold text-white bg-brand-blue">
              {cartItems.length}
            </span>
          </h1>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all"
                className="w-5 h-5 accent-brand-blue cursor-pointer"
                checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                onChange={(e) => selectAll(e.target.checked)}
              />
              <label htmlFor="select-all" className="text-sm font-bold text-text-secondary cursor-pointer select-none">
                Chọn tất cả
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cartItems.map((item) => {
              const p = item.product || item;
              const imgUrl = getImageUrl(getFirstImage(p));
              const isUpdating = updating === item.id;
              const isRemoving = removing === item.id;
              const isSelected = selectedIds.includes(item.id);

              return (
                <div key={item.id} className={`card p-4 flex gap-4 items-center transition-all ${(isUpdating || isRemoving) ? "opacity-60" : "opacity-100"} ${isSelected ? "border-brand-blue/30 bg-brand-blue/[0.02]" : ""}`}>
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-5 h-5 accent-brand-blue cursor-pointer"
                    />
                  </div>

                  {/* Image */}
                  <Link to={`/products/${p.id}`} className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-surface-muted rounded-xl overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <span className="material-symbols-outlined">image_not_supported</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${p.id}`} className="font-semibold text-text-primary hover:text-brand-blue transition-colors line-clamp-2 text-sm leading-snug">
                      {p.name}
                    </Link>
                    {p.brand && <p className="text-xs text-brand-teal font-semibold mt-0.5">{p.brand}</p>}

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-surface-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-surface-muted disabled:opacity-40 transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                        </button>
                        <div className="min-w-[36px] h-8 flex items-center justify-center text-sm font-bold text-text-primary border-x border-surface-border">
                          {isUpdating
                            ? <span className="material-symbols-outlined animate-spin text-brand-blue" style={{ fontSize: 14 }}>progress_activity</span>
                            : item.quantity
                          }
                        </div>
                        <button
                          onClick={() => handleQuantityChange(item, 1)}
                          disabled={isUpdating || item.quantity >= (p.quantity ?? 999)}
                          className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-surface-muted disabled:opacity-40 transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        </button>
                      </div>

                      <span className="font-bold text-brand-blue text-base">{formatVND((p.price || 0) * item.quantity)}</span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isRemoving || isUpdating}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-all flex-shrink-0 self-start"
                  >
                    {isRemoving
                      ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                      : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_outline</span>
                    }
                  </button>
                </div>
              );
            })}

            <Link to="/shop" className="flex items-center gap-2 text-sm text-brand-blue font-semibold hover:underline mt-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-title font-bold text-text-primary mb-5">Tóm tắt đơn hàng</h3>

              <div className="flex flex-col gap-3 pb-5 border-b border-surface-border text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tạm tính ({selectedIds.length} sản phẩm được chọn)</span>
                  <span className="font-semibold text-text-primary">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phí vận chuyển</span>
                  <span className={`font-semibold ${shipping === 0 ? "text-brand-green" : "text-text-primary"}`}>
                    {shipping === 0 ? "Miễn phí" : formatVND(shipping)}
                  </span>
                </div>
                {subtotal > 0 && subtotal < freeShipLimit && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14 }}>info</span>
                    Thêm {formatVND(freeShipLimit - subtotal)} để được miễn phí vận chuyển
                  </div>
                )}
                {shipping === 0 && subtotal > 0 && (
                  <div className="flex items-center gap-2 text-xs text-brand-green bg-brand-green-light rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                    Bạn được miễn phí vận chuyển!
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-5 mb-6">
                <span className="font-bold text-text-primary">Tổng cộng</span>
                <span className="text-xl font-extrabold text-brand-blue">{formatVND(total)}</span>
              </div>

              <button
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
                    return;
                  }
                  navigate("/checkout");
                }}
                disabled={selectedIds.length === 0}
                className="w-full btn-primary py-4 rounded-xl text-base disabled:opacity-50 disabled:grayscale"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payment</span>
                Đặt hàng ngay
              </button>

              {/* Trust signals */}
              <div className="mt-5 pt-5 border-t border-surface-border grid grid-cols-2 gap-2.5">
                {[
                  { icon: "lock", text: "Thanh toán an toàn" },
                  { icon: "verified_user", text: "Hàng chính hãng" },
                  { icon: "cached", text: "Đổi trả 30 ngày" },
                  { icon: "local_shipping", text: "Giao toàn quốc" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 14 }}>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}