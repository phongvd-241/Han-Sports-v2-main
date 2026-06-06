import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { settingApi } from "../../api/settingApi";
import { productApi } from "../../api/productApi";
import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import EmptyState from "../../components/admin/EmptyState";
import { useSettingStore } from "../../store/useSettingStore";
import { notifySync, syncEvent } from "../../utils/sync";
import { getImageUrl, getFirstImage } from "../../utils/constants";

const TABS = [
  { key: "banner", label: "Banner", icon: "image" },
  { key: "navigation", label: "Menu", icon: "menu" },
  { key: "catalog", label: "Catalog", icon: "category" },
  { key: "shipping", label: "Vận chuyển", icon: "local_shipping" },
  { key: "contact", label: "Liên hệ", icon: "call" },
];

const ROUTE_OPTIONS = [
  { label: "Trang chủ", value: "/" },
  { label: "Cửa hàng", value: "/shop" },
  { label: "Giỏ hàng", value: "/cart" },
  { label: "Tài khoản", value: "/profile" },
  { label: "Đơn hàng của tôi", value: "/orders" },
  { label: "Khuyến mãi", value: "/shop?sale=true" },
];

const ICON_OPTIONS = [
  "sports_tennis",
  "footprint",
  "dry_cleaning",
  "backpack",
  "local_fire_department",
  "fitness_center",
  "sports_handball",
  "category",
];

const COLOR_OPTIONS = [
  { label: "Xanh dương", value: "bg-brand-blue-light text-brand-blue", preview: "bg-brand-blue" },
  { label: "Xanh lá", value: "bg-brand-green-light text-brand-green", preview: "bg-brand-green" },
  { label: "Xanh teal", value: "bg-brand-teal-light text-brand-teal", preview: "bg-brand-teal" },
  { label: "Đỏ", value: "bg-red-50 text-danger", preview: "bg-danger" },
  { label: "Vàng", value: "bg-amber-50 text-amber-600", preview: "bg-amber-500" },
  { label: "Xám", value: "bg-surface-muted text-text-primary", preview: "bg-text-muted" },
];

const DEFAULT_HEADER_NAV = [
  { label: "Trang chủ", path: "/", active: true },
  { label: "Cửa hàng", path: "/shop", active: true },
  { label: "Khuyến mãi", path: "/shop?sale=true", active: true },
];

export default function SettingsPage() {
  const { settings, getSetting, refreshAdminSettings } = useSettingStore();
  const [activeTab, setActiveTab] = useState("banner");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = useMemo(() => {
    const headerNav = normalizeNavList(getSetting("HEADER_NAV", DEFAULT_HEADER_NAV));
    return {
      hotline: String(getSetting("HOTLINE", "090 123 4567")),
      shippingFee: String(getSetting("SHIPPING_FEE", "30000")),
      freeShipLimit: String(getSetting("FREE_SHIP_LIMIT", "500000")),
      brands: normalizeStringList(getSetting("BRANDS", ["Yonex", "Victor", "Lining"])),
      targets: normalizeStringList(getSetting("TARGETS", ["Nam", "Nữ", "Unisex"])),
      slides: normalizeSlides(getSetting("HERO_SLIDES", [])),
      categories: normalizeCategories(getSetting("CATEGORIES", [])),
      headerNav,
    };
  }, [getSetting]);

  const isDirty = form ? stableStringify(toComparable(form)) !== stableStringify(toComparable(defaultForm)) : false;
  const activeTabDirty = form ? stableStringify(getTabComparable(form, activeTab)) !== stableStringify(getTabComparable(defaultForm, activeTab)) : false;

  useEffect(() => {
    if (settings) setForm(defaultForm);
  }, [defaultForm, settings]);

  useEffect(() => {
    refreshAdminSettings();
  }, [refreshAdminSettings]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const updateListItem = (name, index, field, value) => {
    setForm((current) => {
      const items = [...current[name]];
      items[index] = { ...items[index], [field]: value };
      return { ...current, [name]: items };
    });
  };

  const addListItem = (name, item) => {
    setForm((current) => ({ ...current, [name]: [...current[name], item] }));
  };

  const removeListItem = (name, index) => {
    setForm((current) => {
      const items = [...current[name]];
      items.splice(index, 1);
      return { ...current, [name]: items };
    });
  };

  const moveListItem = (name, index, direction) => {
    setForm((current) => {
      const items = [...current[name]];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return current;
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      return { ...current, [name]: items };
    });
  };

  const handleBannerUpload = async (index, file) => {
    if (!file) return;
    const toastId = toast.loading("Đang tải ảnh lên...");
    try {
      const res = await productApi.uploadFile(file, "banner");
      const uploaded = res.data?.data?.fileName || res.data?.fileName;
      const fileName = Array.isArray(uploaded) ? uploaded[0] : (uploaded || "");
      updateListItem("slides", index, "image", fileName);
      updateListItem("slides", index, "imageFolder", "banner");
      toast.success("Tải ảnh lên thành công.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Tải ảnh thất bại.", { id: toastId });
    }
  };

  const saveAll = async (event) => {
    event.preventDefault();
    if (!validateSettings(form, activeTab, setActiveTab)) return;

    setSaving(true);
    try {
      await settingApi.updateSiteSettings(toSitePayload(form));
      await refreshAdminSettings();
      notifySync(syncEvent.SETTING_UPDATED);
      toast.success("Đã lưu toàn bộ cấu hình.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const saveCurrentTab = async () => {
    if (!validateSettings(form, activeTab, setActiveTab)) return;

    setSaving(true);
    try {
      await settingApi.updateBulkSettings(toTabUpdates(form, activeTab));
      await refreshAdminSettings();
      notifySync(syncEvent.SETTING_UPDATED);
      toast.success(`Đã lưu tab ${TABS.find((tab) => tab.key === activeTab)?.label || ""}.`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu tab hiện tại.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setForm(defaultForm);
    toast.success("Đã khôi phục dữ liệu gốc.");
  };

  if (!form) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeSlides = form.slides.filter((slide) => slide.active !== false).length;
  const activeCategories = form.categories.filter((item) => item.active !== false).length;
  const activeNavItems = form.headerNav.filter((item) => item.active !== false).length;

  return (
    <div className="max-w-6xl flex flex-col gap-6">
      <AdminPageHeader
        title="Cấu hình hệ thống"
        description="Quản lý nội dung public của website bằng form có preview, trạng thái hiển thị và validation rõ ràng."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="image" label="Banner đang bật" value={`${activeSlides}/${form.slides.length}`} hint="Slide trang chủ" tone="blue" />
        <AdminMetricCard icon="menu" label="Menu đang bật" value={`${activeNavItems}/${form.headerNav.length}`} hint="Liên kết header" tone="teal" />
        <AdminMetricCard icon="category" label="Danh mục đang bật" value={`${activeCategories}/${form.categories.length}`} hint="Danh mục trang chủ" tone="green" />
        <AdminMetricCard icon="local_shipping" label="Miễn phí ship" value={formatVnd(form.freeShipLimit)} hint={`Phí ship ${formatVnd(form.shippingFee)}`} tone="amber" />
      </div>

      <form onSubmit={saveAll} className="card overflow-hidden">
        <div className="border-b border-surface-border bg-surface-soft">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 p-3">
            <div className="overflow-x-auto hide-scrollbar">
              <div className="flex min-w-max gap-1">
                {TABS.map((tab) => {
                  const dirty = form && stableStringify(getTabComparable(form, tab.key)) !== stableStringify(getTabComparable(defaultForm, tab.key));
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === tab.key ? "bg-white text-brand-blue shadow-sm" : "text-text-secondary hover:text-brand-blue hover:bg-white/70"
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                      {tab.label}
                      {dirty && <span className="w-2 h-2 rounded-full bg-amber-500" aria-label="Có thay đổi chưa lưu" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 px-1">
              <button type="button" onClick={handleRevert} disabled={!isDirty || saving} className="btn-ghost text-text-muted hover:text-brand-blue disabled:opacity-40">
                Khôi phục
              </button>
              <button type="button" onClick={saveCurrentTab} disabled={!activeTabDirty || saving} className="btn-outline py-2.5 px-4 disabled:opacity-40">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save_as</span>
                Lưu tab hiện tại
              </button>
              <button type="submit" disabled={!isDirty || saving} className="btn-primary py-2.5 px-5 disabled:opacity-50">
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                    Lưu toàn bộ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {activeTab === "banner" && (
            <BannerSettings
              slides={form.slides}
              onAdd={() => addListItem("slides", {
                title: "Banner mới",
                subtitle: "",
                cta: "Mua ngay",
                ctaLink: "/shop",
                image: "",
                imageFolder: "banner",
                altText: "",
                active: true,
              })}
              onRemove={(index) => removeListItem("slides", index)}
              onMove={(index, direction) => moveListItem("slides", index, direction)}
              onChange={(index, field, value) => updateListItem("slides", index, field, value)}
              onUpload={handleBannerUpload}
            />
          )}

          {activeTab === "navigation" && (
            <NavigationSettings
              items={form.headerNav}
              onAdd={() => addListItem("headerNav", { label: "Liên kết mới", path: "/shop", active: true })}
              onRemove={(index) => removeListItem("headerNav", index)}
              onMove={(index, direction) => moveListItem("headerNav", index, direction)}
              onChange={(index, field, value) => updateListItem("headerNav", index, field, value)}
            />
          )}

          {activeTab === "catalog" && (
            <CatalogSettings
              brands={form.brands}
              targets={form.targets}
              categories={form.categories}
              onField={updateField}
              onAddCategory={() => addListItem("categories", {
                name: "Danh mục mới",
                icon: "category",
                path: "/shop",
                color: "bg-surface-muted text-text-primary",
                active: true,
              })}
              onRemoveCategory={(index) => removeListItem("categories", index)}
              onMoveCategory={(index, direction) => moveListItem("categories", index, direction)}
              onCategoryChange={(index, field, value) => updateListItem("categories", index, field, value)}
            />
          )}

          {activeTab === "shipping" && (
            <ShippingSettings
              shippingFee={form.shippingFee}
              freeShipLimit={form.freeShipLimit}
              onField={updateField}
            />
          )}

          {activeTab === "contact" && (
            <ContactSettings hotline={form.hotline} onField={updateField} />
          )}
        </div>
      </form>
    </div>
  );
}

function BannerSettings({ slides, onAdd, onRemove, onMove, onChange, onUpload }) {
  return (
    <Section
      title="Banner trang chủ"
      description="Quản lý slide hiển thị ở homepage. Admin có thể bật/tắt, sắp xếp thứ tự và xem preview trước khi lưu."
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

              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
                {getFirstImage(slide) ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-surface-border group/img bg-white">
                    <img src={getImageUrl(getFirstImage(slide), slide.imageFolder || "banner")} alt={slide.altText || slide.title || "Banner"} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        onChange(index, "image", "");
                        onChange(index, "imageFolder", "");
                      }}
                      className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                      aria-label="Xóa ảnh banner"
                    >
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>delete</span>
                    </button>
                  </div>
                ) : (
                  <label className="h-32 border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all bg-white">
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 28 }}>image</span>
                    <span className="text-xs font-bold text-text-muted mt-1 uppercase">Tải ảnh</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(event) => onUpload(index, event.target.files[0])} />
                  </label>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="Tiêu đề" value={slide.title || ""} onChange={(value) => onChange(index, "title", value)} placeholder="Ưu đãi thể thao" />
                  <Input label="Nút CTA" value={slide.cta || ""} onChange={(value) => onChange(index, "cta", value)} placeholder="Mua ngay" />
                  <Input label="Mô tả" value={slide.subtitle || ""} onChange={(value) => onChange(index, "subtitle", value)} placeholder="Thông điệp ngắn trên banner" />
                  <RoutePicker label="Đường dẫn CTA" value={slide.ctaLink || ""} onChange={(value) => onChange(index, "ctaLink", value)} />
                  <div className="md:col-span-2">
                    <Input label="Alt text ảnh" value={slide.altText || ""} onChange={(value) => onChange(index, "altText", value)} placeholder="Mô tả ngắn cho ảnh banner" />
                  </div>
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

function NavigationSettings({ items, onAdd, onRemove, onMove, onChange }) {
  return (
    <Section
      title="Thanh menu"
      description="Quản lý liên kết header bằng route gợi ý thay vì yêu cầu admin nhớ đường dẫn thủ công."
      actions={(
        <button type="button" onClick={onAdd} className="btn-outline text-sm py-2 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm liên kết
        </button>
      )}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className={`p-4 border rounded-xl bg-surface-soft ${item.active === false ? "opacity-70" : ""}`}>
              <ItemHeader
                title={`Liên kết ${index + 1}`}
                active={item.active !== false}
                onActiveChange={(value) => onChange(index, "active", value)}
                onMoveUp={() => onMove(index, -1)}
                onMoveDown={() => onMove(index, 1)}
                onRemove={() => onRemove(index)}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
                removeLabel="Xóa liên kết"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Tên hiển thị" value={item.label || ""} onChange={(value) => onChange(index, "label", value)} placeholder="Cửa hàng" />
                <RoutePicker label="Đường dẫn" value={item.path || ""} onChange={(value) => onChange(index, "path", value)} />
              </div>
            </div>
          ))}
        </div>

        <PreviewPanel title="Preview header menu">
          <div className="flex flex-wrap gap-2">
            {items.filter((item) => item.active !== false).map((item, index) => (
              <span key={`${item.label}-${index}`} className="px-3 py-2 rounded-lg bg-white border border-surface-border text-sm font-semibold text-text-primary">
                {item.label || "Chưa đặt tên"}
              </span>
            ))}
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

function CatalogSettings({ brands, targets, categories, onField, onAddCategory, onRemoveCategory, onMoveCategory, onCategoryChange }) {
  return (
    <Section
      title="Catalog sản phẩm"
      description="Quản lý thương hiệu, nhóm đối tượng và danh mục homepage bằng control có sẵn thay vì nhập raw CSS/icon."
      actions={(
        <button type="button" onClick={onAddCategory} className="btn-outline text-sm py-2 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm danh mục
        </button>
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChipEditor label="Thương hiệu" values={brands} onChange={(values) => onField("brands", values)} placeholder="Nhập thương hiệu rồi Enter" />
        <ChipEditor label="Nhóm đối tượng" values={targets} onChange={(values) => onField("targets", values)} placeholder="Nam, Nữ, Unisex..." />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map((cat, index) => (
            <div key={index} className={`p-4 border border-surface-border rounded-xl bg-surface-soft ${cat.active === false ? "opacity-70" : ""}`}>
              <ItemHeader
                title={`Danh mục ${index + 1}`}
                active={cat.active !== false}
                onActiveChange={(value) => onCategoryChange(index, "active", value)}
                onMoveUp={() => onMoveCategory(index, -1)}
                onMoveDown={() => onMoveCategory(index, 1)}
                onRemove={() => onRemoveCategory(index)}
                disableUp={index === 0}
                disableDown={index === categories.length - 1}
                removeLabel="Xóa danh mục"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Tên danh mục" value={cat.name || ""} onChange={(value) => onCategoryChange(index, "name", value)} placeholder="Vợt cầu lông" />
                <Select label="Icon" value={cat.icon || "category"} onChange={(value) => onCategoryChange(index, "icon", value)} options={ICON_OPTIONS.map((icon) => ({ label: icon, value: icon }))} />
                <RoutePicker label="Đường dẫn" value={cat.path || ""} onChange={(value) => onCategoryChange(index, "path", value)} />
                <ColorPicker value={cat.color || COLOR_OPTIONS[0].value} onChange={(value) => onCategoryChange(index, "color", value)} />
              </div>
            </div>
          ))}
          {categories.length === 0 && <EmptyState icon="category" title="Chưa có danh mục nào" className="py-10 bg-surface-muted rounded-xl border border-dashed border-surface-border lg:col-span-2" />}
        </div>

        <PreviewPanel title="Preview danh mục">
          <div className="grid grid-cols-2 gap-3">
            {categories.filter((cat) => cat.active !== false).map((cat, index) => (
              <div key={`${cat.name}-${index}`} className={`rounded-xl p-3 border border-surface-border ${cat.color || "bg-white text-text-primary"}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{cat.icon || "category"}</span>
                <p className="text-sm font-bold mt-2">{cat.name || "Danh mục"}</p>
              </div>
            ))}
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

function ShippingSettings({ shippingFee, freeShipLimit, onField }) {
  return (
    <Section title="Cấu hình vận chuyển" description="Thiết lập phí vận chuyển mặc định và điều kiện miễn phí ship.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="number" label="Phí vận chuyển (VND)" value={shippingFee} onChange={(value) => onField("shippingFee", value)} placeholder="30000" />
          <Input type="number" label="Mức miễn phí ship (VND)" value={freeShipLimit} onChange={(value) => onField("freeShipLimit", value)} placeholder="500000" />
        </div>
        <PreviewPanel title="Preview chính sách">
          <div className="rounded-xl bg-brand-green-light border border-brand-green/20 p-4 text-brand-green">
            <p className="text-sm font-bold">Miễn phí vận chuyển</p>
            <p className="text-sm mt-1">Áp dụng cho đơn hàng từ {formatVnd(freeShipLimit)}.</p>
            <p className="text-xs mt-3 text-text-muted">Đơn dưới mức này áp dụng phí {formatVnd(shippingFee)}.</p>
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

function ContactSettings({ hotline, onField }) {
  return (
    <Section title="Hotline và liên hệ" description="Số điện thoại hiển thị ở header/footer và các điểm hỗ trợ khách hàng.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="max-w-md">
          <Input label="Hotline" value={hotline} onChange={(value) => onField("hotline", value)} placeholder="090 123 4567" />
        </div>
        <PreviewPanel title="Preview header/footer">
          <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white p-4">
            <div className="w-10 h-10 rounded-full bg-brand-blue-light text-brand-blue flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Hotline hỗ trợ</p>
              <p className="font-bold text-text-primary">{hotline || "Chưa cấu hình"}</p>
            </div>
          </div>
        </PreviewPanel>
      </div>
    </Section>
  );
}

function Section({ title, description, actions, children }) {
  return (
    <section>
      <div className="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="text-title font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted mt-1 max-w-2xl">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function ItemHeader({ title, active, onActiveChange, onMoveUp, onMoveDown, onRemove, disableUp, disableDown, removeLabel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</p>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${active ? "bg-brand-green-light text-brand-green" : "bg-surface-muted text-text-muted"}`}>
          {active ? "Đang hiển thị" : "Đang ẩn"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Toggle checked={active} onChange={onActiveChange} label={active ? "Tắt hiển thị" : "Bật hiển thị"} />
        <IconAction icon="keyboard_arrow_up" label="Di chuyển lên" disabled={disableUp} onClick={onMoveUp} />
        <IconAction icon="keyboard_arrow_down" label="Di chuyển xuống" disabled={disableDown} onClick={onMoveDown} />
        <IconAction icon="delete" label={removeLabel} tone="danger" onClick={onRemove} />
      </div>
    </div>
  );
}

function HeroPreview({ slide }) {
  if (!slide) {
    return <EmptyState icon="image" title="Chưa có banner để preview" className="py-8 bg-surface-muted rounded-xl" />;
  }

  const image = getFirstImage(slide);
  return (
    <div className="relative min-h-64 overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-brand-blue to-brand-teal text-white border border-surface-border">
      {image && (
        <img
          src={getImageUrl(image, slide.imageFolder || "banner")}
          alt={slide.altText || slide.title || "Banner preview"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative p-5 min-h-64 flex flex-col justify-end">
        <span className="w-max px-2 py-1 rounded-full bg-white/15 text-xs font-bold mb-3">{slide.active === false ? "Đang ẩn" : "Đang hiển thị"}</span>
        <h4 className="text-2xl font-extrabold leading-tight">{slide.title || "Tiêu đề banner"}</h4>
        <p className="text-sm text-white/80 mt-2">{slide.subtitle || "Mô tả ngắn của banner sẽ hiển thị tại đây."}</p>
        <div className="mt-4 inline-flex w-max items-center gap-2 bg-white text-text-primary rounded-lg px-4 py-2 text-sm font-bold">
          {slide.cta || "Mua ngay"}
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({ title, children }) {
  return (
    <aside className="rounded-xl border border-surface-border bg-surface-soft p-4">
      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{title}</p>
      {children}
    </aside>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2" placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function RoutePicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
        <select
          value={ROUTE_OPTIONS.some((option) => option.value === value) ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="input-field text-sm py-2"
          aria-label={`${label} gợi ý`}
        >
          <option value="">Tùy chỉnh</option>
          {ROUTE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input value={value} onChange={(event) => onChange(event.target.value)} className="input-field text-sm py-2" placeholder="/shop" />
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Màu hiển thị</label>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-lg border flex items-center justify-center gap-1 text-xs font-bold ${value === option.value ? "border-brand-blue ring-2 ring-brand-blue/15" : "border-surface-border"}`}
            aria-label={`Chọn màu ${option.label}`}
          >
            <span className={`w-3 h-3 rounded-full ${option.preview}`} />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipEditor({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const value = draft.trim();
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface-soft p-4">
      <label className="block text-sm font-bold text-text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-surface-border text-sm font-semibold text-text-primary">
            {value}
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="text-text-muted hover:text-danger" aria-label={`Xóa ${value}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          className="input-field text-sm py-2"
          placeholder={placeholder}
        />
        <button type="button" onClick={addDraft} className="btn-outline px-3 py-2" aria-label={`Thêm ${label}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-brand-green" : "bg-surface-muted"}`}
      aria-label={label}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function IconAction({ icon, label, onClick, disabled = false, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 ${
        tone === "danger" ? "text-text-muted hover:bg-red-50 hover:text-danger" : "text-text-muted hover:bg-white hover:text-brand-blue"
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
    </button>
  );
}

function validateSettings(form, activeTab, setActiveTab) {
  const shippingFee = Number(form.shippingFee);
  const freeShipLimit = Number(form.freeShipLimit);
  if (!Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isFinite(freeShipLimit) || freeShipLimit < 0) {
    toast.error("Phí vận chuyển và mức miễn phí ship phải là số không âm.");
    setActiveTab("shipping");
    return false;
  }

  if (!form.hotline.trim()) {
    toast.error("Hotline không được để trống.");
    setActiveTab("contact");
    return false;
  }

  const invalidNav = form.headerNav.some((item) => !item.label?.trim() || !isInternalPath(item.path));
  if (invalidNav) {
    toast.error("Menu phải có tên và đường dẫn bắt đầu bằng dấu /.");
    setActiveTab("navigation");
    return false;
  }

  const invalidCategory = form.categories.some((item) => !item.name?.trim() || !item.icon?.trim() || !item.color?.trim() || !isInternalPath(item.path));
  if (invalidCategory) {
    toast.error("Danh mục phải có tên, icon, màu và đường dẫn bắt đầu bằng dấu /.");
    setActiveTab("catalog");
    return false;
  }

  const invalidSlide = form.slides.some((item) => !item.title?.trim() || (item.ctaLink && !isInternalPath(item.ctaLink)));
  if (invalidSlide) {
    toast.error("Banner phải có tiêu đề và link nội bộ phải bắt đầu bằng dấu /.");
    setActiveTab("banner");
    return false;
  }

  if (activeTab === "catalog" && (form.brands.length === 0 || form.targets.length === 0)) {
    toast.error("Catalog cần ít nhất một thương hiệu và một nhóm đối tượng.");
    return false;
  }

  return true;
}

function toSitePayload(form) {
  return {
    hotline: form.hotline.trim(),
    shippingFee: Number(form.shippingFee),
    freeShipLimit: Number(form.freeShipLimit),
    brands: normalizeStringList(form.brands),
    targets: normalizeStringList(form.targets),
    heroSlides: normalizeSlides(form.slides),
    categories: normalizeCategories(form.categories),
    headerNav: normalizeNavList(form.headerNav),
  };
}

function toTabUpdates(form, tab) {
  const payload = toSitePayload(form);
  const updatesByTab = {
    banner: [{ settingKey: "HERO_SLIDES", settingValue: JSON.stringify(payload.heroSlides) }],
    navigation: [{ settingKey: "HEADER_NAV", settingValue: JSON.stringify(payload.headerNav) }],
    catalog: [
      { settingKey: "BRANDS", settingValue: JSON.stringify(payload.brands) },
      { settingKey: "TARGETS", settingValue: JSON.stringify(payload.targets) },
      { settingKey: "CATEGORIES", settingValue: JSON.stringify(payload.categories) },
    ],
    shipping: [
      { settingKey: "SHIPPING_FEE", settingValue: String(payload.shippingFee) },
      { settingKey: "FREE_SHIP_LIMIT", settingValue: String(payload.freeShipLimit) },
    ],
    contact: [{ settingKey: "HOTLINE", settingValue: payload.hotline }],
  };
  return updatesByTab[tab] || [];
}

function getTabComparable(form, tab) {
  const comparable = toComparable(form);
  const byTab = {
    banner: { slides: comparable.slides },
    navigation: { headerNav: comparable.headerNav },
    catalog: { brands: comparable.brands, targets: comparable.targets, categories: comparable.categories },
    shipping: { shippingFee: comparable.shippingFee, freeShipLimit: comparable.freeShipLimit },
    contact: { hotline: comparable.hotline },
  };
  return byTab[tab] || comparable;
}

function toComparable(form) {
  return toSitePayload(form);
}

function normalizeSlides(slides) {
  return Array.isArray(slides) ? slides.map((slide) => ({
    title: slide.title || "",
    subtitle: slide.subtitle || "",
    cta: slide.cta || "",
    ctaLink: slide.ctaLink || "",
    image: slide.image || "",
    imageFolder: slide.imageFolder || "banner",
    altText: slide.altText || slide.title || "",
    bg: slide.bg || "",
    active: slide.active !== false,
  })) : [];
}

function normalizeCategories(categories) {
  return Array.isArray(categories) ? categories.map((category) => ({
    name: category.name || "",
    icon: category.icon || "category",
    path: category.path || "/shop",
    color: category.color || COLOR_OPTIONS[0].value,
    active: category.active !== false,
  })) : [];
}

function normalizeNavList(items) {
  return Array.isArray(items) ? items.map((item) => ({
    label: item.label || "",
    path: item.path || "/shop",
    active: item.active !== false,
  })) : [];
}

function normalizeStringList(values) {
  if (Array.isArray(values)) {
    return values.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof values === "string") {
    return values.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function isInternalPath(path) {
  return typeof path === "string" && path.startsWith("/");
}

function stableStringify(value) {
  return JSON.stringify(value);
}

function formatVnd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0đ";
  return `${number.toLocaleString("vi-VN")}đ`;
}
