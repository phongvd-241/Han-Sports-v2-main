import { Section, ItemHeader } from "./components/SettingUI";
import PreviewPanel from "./components/PreviewPanel";
import RoutePicker from "./components/RoutePicker";
import SafeImage from "../../../components/common/SafeImage";
import EmptyState from "../../../components/admin/EmptyState";
import { getImageUrl, getFirstImage } from "../../../utils/constants";

export default function BannerSettings({
  slides,
  onAdd,
  onRemove,
  onMove,
  onChange,
  onUpload,
  uploadingIndex,
}) {
  return (
    <Section
      title="Banner trang chủ"
      description="Mỗi banner chỉ gồm ảnh và đường dẫn khi người dùng nhấn vào ảnh."
      actions={(
        <button type="button" onClick={onAdd} className="btn-outline text-sm py-2 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm banner
        </button>
      )}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="flex flex-col gap-4">
          {slides.map((slide, index) => (
            <div key={index} className={`p-4 border rounded-xl bg-surface-soft ${slide.active === false ? "border-surface-border opacity-70" : "border-brand-blue/20"}`}>
              <ItemHeader
                title={`Banner ${index + 1}`}
                active={slide.active !== false}
                onActiveChange={(value) => onChange(index, "active", value)}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(index)}
                disableUp={index === 0}
                disableDown={index === slides.length - 1}
                removeLabel="Xóa banner"
              />

              <div className="grid grid-cols-1 gap-4">
                <div className="relative aspect-[16/6] min-h-40 rounded-lg overflow-hidden border border-surface-border bg-white">
                  {getFirstImage(slide) ? (
                    <SafeImage
                      src={getImageUrl(getFirstImage(slide), slide.imageFolder || "banner")}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                      fallbackClassName="w-full h-full bg-surface-muted"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                      <span className="material-symbols-outlined" style={{ fontSize: 42 }}>add_photo_alternate</span>
                      <span className="mt-2 text-sm font-semibold">Chưa chọn ảnh banner</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className={`btn-outline text-sm py-2 px-3 cursor-pointer ${uploadingIndex === index ? "pointer-events-none opacity-60" : ""}`}>
                    <span className={`material-symbols-outlined ${uploadingIndex === index ? "animate-spin" : ""}`} style={{ fontSize: 18 }}>
                      {uploadingIndex === index ? "progress_activity" : "upload"}
                    </span>
                    {uploadingIndex === index ? "Đang tải..." : (getFirstImage(slide) ? "Thay ảnh" : "Chọn ảnh")}
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      disabled={uploadingIndex === index}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        onUpload(index, file);
                      }}
                    />
                  </label>

                  {getFirstImage(slide) && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(index, "image", "");
                        onChange(index, "imageFolder", "banner");
                      }}
                      className="btn-ghost text-danger text-sm py-2 px-3"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      Xóa ảnh
                    </button>
                  )}
                  <span className="text-xs text-text-muted">JPG, PNG hoặc WebP, tối đa 5MB.</span>
                </div>

                <div className="max-w-2xl">
                  <RoutePicker
                    label="Đường dẫn khi nhấn banner"
                    value={slide.ctaLink || ""}
                    onChange={(value) => onChange(index, "ctaLink", value)}
                  />
                </div>
              </div>
            </div>
          ))}
          {slides.length === 0 && <EmptyState icon="image" title="Chưa có banner nào" description="Thêm banner đầu tiên để hiển thị trên trang chủ." className="py-10 bg-surface-muted rounded-xl border border-dashed border-surface-border" />}
        </div>

        <div className="xl:sticky xl:top-24 self-start">
          <PreviewPanel title="Preview banner đầu tiên đang bật">
            <HeroPreview slide={slides.find((slide) => slide.active !== false) || slides[0]} />
          </PreviewPanel>
        </div>
      </div>
    </Section>
  );
}

function HeroPreview({ slide }) {
  if (!slide) {
    return <EmptyState icon="image" title="Chưa có banner để preview" className="py-8 bg-surface-muted rounded-xl" />;
  }

  const image = getFirstImage(slide);
  return (
    <div className="relative aspect-[16/6] min-h-48 overflow-hidden rounded-xl bg-surface-muted border border-surface-border">
      {image ? (
        <SafeImage
          src={getImageUrl(image, slide.imageFolder || "banner")}
          alt="Banner preview"
          className="w-full h-full object-cover"
          fallbackClassName="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>image_not_supported</span>
          <span className="mt-2 text-sm font-semibold">Chưa chọn ảnh banner</span>
        </div>
      )}
    </div>
  );
}
