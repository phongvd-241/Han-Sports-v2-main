import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";
import { getImageUrl, formatVND, getFirstImage } from "../../utils/constants";

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

  return (
    <div className="group card relative flex flex-col overflow-hidden">
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {(discountPercent || salePercent > 0) && (
          <span className="badge-danger text-[10px] px-1.5 py-0.5">-{discountPercent || salePercent}%</span>
        )}
        {badge === "new" && (
          <span className="badge-green text-[10px] px-1.5 py-0.5">Mới</span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-100 text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-pill">Hết hàng</span>
        )}
      </div>

      <Link to={`/products/${id}`} className="block relative overflow-hidden bg-surface-soft" style={{ paddingTop: "100%" }}>
        {imageSrc ? (
          <SafeImage
            src={imageSrc}
            alt={name}
            className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
            fallbackClassName="absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
            <span className="material-symbols-outlined" style={{ fontSize: 56 }}>image_not_supported</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="flex flex-col flex-1 p-4">
        {brand && (
          <span className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-1">{brand}</span>
        )}
        <Link
          to={`/products/${id}`}
          className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug hover:text-brand-blue transition-colors mb-2"
        >
          {name}
        </Link>

        {sold > 0 && (
          <p className="text-xs text-text-muted mb-2">Đã bán: {sold.toLocaleString("vi-VN")}</p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-brand-blue">{formatVND(price)}</span>
            {hasSalePrice && (
              <span className="text-xs text-text-muted line-through">{formatVND(originalPrice)}</span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isOutOfStock && onAddCart) onAddCart(product);
            }}
            disabled={isOutOfStock}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${isOutOfStock
                ? "bg-surface-muted text-text-muted cursor-not-allowed"
                : "btn-primary py-2 text-sm active:scale-95"
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {isOutOfStock ? "remove_shopping_cart" : "add_shopping_cart"}
            </span>
            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}
