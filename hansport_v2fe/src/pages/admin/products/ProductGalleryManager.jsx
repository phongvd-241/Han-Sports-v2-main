import { useState } from "react";
import { getImageUrl } from "../../../utils/constants";
import { MAX_PRODUCT_IMAGES } from "./productFormUtils";

export default function ProductGalleryManager({
  images = [],
  uploading,
  fileRef,
  onUpload,
  onRemove,
  onSetMain,
  onMoveUp,
  onMoveDown,
}) {
  const [brokenImages, setBrokenImages] = useState([]);

  const handleImageError = (imgUrl) => {
    if (!brokenImages.includes(imgUrl)) {
      setBrokenImages((prev) => [...prev, imgUrl]);
    }
  };

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-surface-muted p-4 rounded-xl border border-surface-border">
        <div>
          <p className="text-sm font-bold text-text-primary">
            Ảnh sản phẩm ({images.length}/{MAX_PRODUCT_IMAGES})
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Ảnh đầu tiên (ở vị trí số 1) luôn được thiết lập làm ảnh đại diện hiển thị trên cửa hàng.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || images.length >= MAX_PRODUCT_IMAGES}
          className="btn-outline py-2 px-4 text-sm disabled:opacity-50 hover:bg-brand-blue/5"
        >
          {uploading ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang tải ảnh...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_photo_alternate</span> Chọn nhiều ảnh
            </>
          )}
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, idx) => {
            const isMain = idx === 0;
            const isBroken = brokenImages.includes(img);

            return (
              <div
                key={img}
                className={`group relative rounded-xl border bg-white p-2.5 transition-all duration-300 flex flex-col justify-between ${
                  isMain
                    ? "border-brand-green ring-2 ring-brand-green/10 shadow-sm"
                    : "border-surface-border hover:border-text-muted hover:shadow-card"
                }`}
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-square rounded-lg bg-surface-soft overflow-hidden flex items-center justify-center border border-surface-muted">
                  {/* Badge Ảnh chính */}
                  {isMain ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-green text-white text-[9px] font-bold z-10 shadow-sm flex items-center gap-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 10 }}>star</span>
                      Ảnh chính
                    </span>
                  ) : (
                    /* Nút đặt làm ảnh chính hiện lên khi hover */
                    <button
                      type="button"
                      onClick={() => onSetMain(img)}
                      className="absolute top-2 left-2 px-2 py-1 rounded bg-black/75 hover:bg-brand-green text-white text-[9px] font-bold z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      Đặt làm ảnh chính
                    </button>
                  )}

                  {/* Vị trí thứ tự ảnh (Chỉ số hiển thị 1-indexed) */}
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center z-10">
                    {idx + 1}
                  </span>

                  {/* Render Image or Fallback */}
                  {isBroken ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-danger bg-red-50 p-2 text-center">
                      <span className="material-symbols-outlined text-3xl">broken_image</span>
                      <span className="text-[10px] font-bold mt-1.5 leading-tight">Không tải được ảnh</span>
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(img)}
                      alt={`Ảnh sản phẩm ${idx + 1}`}
                      onError={() => handleImageError(img)}
                      className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Toolbar di chuyển & Xóa */}
                <div className="mt-3 flex items-center justify-between gap-1 border-t border-surface-muted pt-2.5 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {/* Di chuyển lên */}
                    <button
                      type="button"
                      onClick={() => onMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-surface-soft hover:bg-surface-muted text-text-secondary disabled:opacity-30 disabled:hover:bg-surface-soft transition-colors"
                      title="Di chuyển lên (Đặt làm ảnh đại diện)"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_upward</span>
                    </button>

                    {/* Di chuyển xuống */}
                    <button
                      type="button"
                      onClick={() => onMoveDown(idx)}
                      disabled={idx === images.length - 1}
                      className="p-1 rounded bg-surface-soft hover:bg-surface-muted text-text-secondary disabled:opacity-30 disabled:hover:bg-surface-soft transition-colors"
                      title="Di chuyển xuống"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
                    </button>
                  </div>

                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="p-1 rounded bg-red-50 hover:bg-danger/10 text-danger transition-colors"
                    title="Xóa hình ảnh này"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full min-h-36 rounded-2xl border-2 border-dashed border-surface-border bg-white flex flex-col items-center justify-center text-text-muted hover:border-brand-green hover:text-brand-green transition-all duration-300 shadow-sm"
        >
          <span className="material-symbols-outlined text-4xl text-text-muted/60">collections</span>
          <span className="text-sm font-semibold mt-2.5">Chọn ảnh sản phẩm</span>
          <span className="text-xs mt-1 text-text-muted/70">Hỗ trợ JPG, PNG hoặc WebP, tối đa 8 ảnh</span>
        </button>
      )}
    </div>
  );
}
