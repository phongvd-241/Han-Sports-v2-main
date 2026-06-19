import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";
import { useState } from "react";

export default function ProductCard({ product, discountPercent, badge, onAddCart }) {
  const { id, name, price, brand, sold, quantity } = product;
  const computedOriginalPrice = discountPercent
    ? Math.round(price / (1 - discountPercent / 100))
    : null;
  const originalPrice = Number(product.originalPrice || computedOriginalPrice || 0);
  const hasSalePrice = originalPrice > Number(price || 0);
  const salePercent = hasSalePrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const isOutOfStock = quantity === 0;
  const imageVersion = product.updatedAt || product.createdAt || product.id;
  const imageSrc = getImageUrl(getFirstImage(product), "product", imageVersion);

  const [cartState, setCartState] = useState("idle"); // "idle" | "loading" | "success"

  const handleAddClick = async (e) => {
    e.preventDefault();
    if (isOutOfStock || cartState !== "idle" || !onAddCart) return;

    setCartState("loading");
    const startTime = Date.now();
    const success = await onAddCart(product);
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(500 - elapsedTime, 0);

    setTimeout(() => {
      if (success) {
        setCartState("success");
        setTimeout(() => setCartState("idle"), 1800);
      } else {
        setCartState("idle");
      }
    }, remainingTime);
  };

  return (
    <div className="group glass-card relative flex flex-col overflow-hidden h-full">
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {salePercent > 0 && (
          <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-lg shadow-[0_2px_8px_rgba(244,63,94,0.4)] tracking-wide">-{salePercent}%</span>
        )}
        {badge === "new" && (
          <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-lg shadow-[0_2px_8px_rgba(16,185,129,0.4)] tracking-wide">Mới</span>
        )}
        {isOutOfStock && (
          <span className="bg-slate-900/90 text-white/50 border border-white/10 font-bold text-[10px] px-2 py-0.5 rounded-lg tracking-wide">Hết hàng</span>
        )}
      </div>

      <Link to={`/products/${id}`} className="block relative overflow-hidden bg-white/5 border-b border-white/5" style={{ paddingTop: "100%" }}>
        {imageSrc ? (
          <SafeImage
            src={imageSrc}
            alt={name}
            className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
            fallbackClassName="absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">
            <span className="material-symbols-outlined" style={{ fontSize: 56 }}>image_not_supported</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="flex flex-col flex-1 p-4">
        {brand && (
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">{brand}</span>
        )}
        <Link
          to={`/products/${id}`}
          className="text-sm font-semibold text-white line-clamp-2 leading-snug hover:text-green-400 transition-colors mb-2"
        >
          {name}
        </Link>

        {sold > 0 && (
          <p className="text-xs text-white/60 mb-2">Đã bán: {sold.toLocaleString("vi-VN")}</p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-blue-400">{formatVND(price)}</span>
            {hasSalePrice && (
              <span className="text-xs text-white/40 line-through">{formatVND(originalPrice)}</span>
            )}
          </div>

          <button
            onClick={handleAddClick}
            disabled={isOutOfStock || cartState !== "idle"}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                : cartState === "loading"
                ? "bg-white/10 text-white/50 border border-white/10 cursor-wait py-2 text-sm"
                : cartState === "success"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent py-2 text-sm shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[1.02]"
                : "glass-btn-primary py-2 text-sm active:scale-95"
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
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                <span>Đã thêm! (✓)</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {isOutOfStock ? "remove_shopping_cart" : "add_shopping_cart"}
                </span>
                <span>{isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
