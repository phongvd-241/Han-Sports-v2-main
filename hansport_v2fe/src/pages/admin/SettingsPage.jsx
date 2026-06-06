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

export default function SettingsPage() {
  const { settings, getSetting, refreshSettings } = useSettingStore();
  const [activeTab, setActiveTab] = useState("banner");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = useMemo(() => ({
    hotline: getSetting("HOTLINE", "090 123 4567"),
    shippingFee: getSetting("SHIPPING_FEE", "30000"),
    freeShipLimit: getSetting("FREE_SHIP_LIMIT", "500000"),
    brands: getSetting("BRANDS", []).join(", "),
    targets: getSetting("TARGETS", []).join(", "),
    slides: getSetting("HERO_SLIDES", []),
    categories: getSetting("CATEGORIES", []),
    headerNav: getSetting("HEADER_NAV", []),
  }), [getSetting]);

  useEffect(() => {
    if (settings) setForm(defaultForm);
  }, [defaultForm, settings]);

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

  const validateSettings = () => {
    const shippingFee = Number(form.shippingFee);
    const freeShipLimit = Number(form.freeShipLimit);
    if (!Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isFinite(freeShipLimit) || freeShipLimit < 0) {
      toast.error("Phí vận chuyển và mức miễn phí ship phải là số không âm.");
      setActiveTab("shipping");
      return false;
    }

    const invalidNav = form.headerNav.some((item) => !item.label?.trim() || !item.path?.startsWith("/"));
    if (invalidNav) {
      toast.error("Menu phải có tên và đường dẫn bắt đầu bằng dấu /.");
      setActiveTab("navigation");
      return false;
    }

    const invalidCategory = form.categories.some((item) => !item.name?.trim() || !item.path?.startsWith("/"));
    if (invalidCategory) {
      toast.error("Danh mục phải có tên và đường dẫn bắt đầu bằng dấu /.");
      setActiveTab("catalog");
      return false;
    }

    const invalidSlide = form.slides.some((item) => item.ctaLink && !item.ctaLink.startsWith("/"));
    if (invalidSlide) {
      toast.error("Link banner nội bộ phải bắt đầu bằng dấu /.");
      setActiveTab("banner");
      return false;
    }

    return true;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateSettings()) return;

    setSaving(true);
    try {
      const updates = [
        { settingKey: "HOTLINE", settingValue: form.hotline },
        { settingKey: "SHIPPING_FEE", settingValue: String(Number(form.shippingFee)) },
        { settingKey: "FREE_SHIP_LIMIT", settingValue: String(Number(form.freeShipLimit)) },
        { settingKey: "BRANDS", settingValue: JSON.stringify(splitComma(form.brands)) },
        { settingKey: "TARGETS", settingValue: JSON.stringify(splitComma(form.targets)) },
        { settingKey: "HERO_SLIDES", settingValue: JSON.stringify(form.slides) },
        { settingKey: "CATEGORIES", settingValue: JSON.stringify(form.categories) },
        { settingKey: "HEADER_NAV", settingValue: JSON.stringify(form.headerNav) },
      ];
      await settingApi.updateBulkSettings(updates);
      await refreshSettings();
      notifySync(syncEvent.SETTING_UPDATED);
      toast.success("Cập nhật cấu hình thành công.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu cấu hình.");
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

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <AdminPageHeader
        title="Cấu hình hệ thống"
        description="Quản lý nội dung hiển thị, menu, danh mục và chính sách vận chuyển."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="image" label="Banner" value={form.slides.length.toLocaleString("vi-VN")} hint="Slide trang chủ" tone="blue" />
        <AdminMetricCard icon="menu" label="Menu" value={form.headerNav.length.toLocaleString("vi-VN")} hint="Liên kết header" tone="teal" />
        <AdminMetricCard icon="category" label="Danh mục" value={form.categories.length.toLocaleString("vi-VN")} hint="Danh mục trang chủ" tone="green" />
        <AdminMetricCard icon="local_shipping" label="Miễn phí ship" value={`${Number(form.freeShipLimit).toLocaleString("vi-VN")}đ`} hint={`Phí ship ${Number(form.shippingFee).toLocaleString("vi-VN")}đ`} tone="amber" />
      </div>

      <form onSubmit={handleSave} className="card overflow-hidden">
        <div className="border-b border-surface-border overflow-x-auto hide-scrollbar bg-surface-soft">
          <div className="flex min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.key ? "border-brand-blue text-brand-blue bg-white" : "border-transparent text-text-secondary hover:text-brand-blue hover:bg-white/60"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-6">
          {activeTab === "banner" && (
            <BannerSettings
              slides={form.slides}
              onAdd={() => addListItem("slides", { title: "", subtitle: "", cta: "", ctaLink: "", image: "", imageFolder: "banner" })}
              onRemove={(index) => removeListItem("slides", index)}
              onChange={(index, field, value) => updateListItem("slides", index, field, value)}
              onUpload={handleBannerUpload}
            />
          )}

          {activeTab === "navigation" && (
            <NavigationSettings
              items={form.headerNav}
              onAdd={() => addListItem("headerNav", { label: "", path: "/shop" })}
              onRemove={(index) => removeListItem("headerNav", index)}
              onChange={(index, field, value) => updateListItem("headerNav", index, field, value)}
            />
          )}

          {activeTab === "catalog" && (
            <CatalogSettings
              brands={form.brands}
              targets={form.targets}
              categories={form.categories}
              onField={updateField}
              onAddCategory={() => addListItem("categories", { name: "", icon: "category", path: "/shop", color: "bg-surface-muted text-text-primary" })}
              onRemoveCategory={(index) => removeListItem("categories", index)}
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

        <div className="px-5 md:px-6 py-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-end gap-3 bg-surface-soft">
          <button type="button" onClick={handleRevert} className="btn-ghost text-text-muted hover:text-brand-blue flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>restart_alt</span>
            Khôi phục thay đổi
          </button>
          <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-base disabled:opacity-60">
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                Đang lưu...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span>
                Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function BannerSettings({ slides, onAdd, onRemove, onChange, onUpload }) {
  return (
    <Section title="Banner trang chủ" description="Quản lý ảnh banner và đường dẫn khi người dùng nhấn vào banner.">
      <div className="flex justify-end mb-4">
        <button type="button" onClick={onAdd} className="btn-outline text-sm py-1.5 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm banner
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {slides.map((slide, index) => (
          <div key={index} className="p-4 border border-surface-border rounded-xl bg-surface-soft relative group">
            <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-danger" aria-label="Xóa banner">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
            </button>
            <p className="text-xs font-bold text-text-muted mb-4 uppercase tracking-wider">Banner {index + 1}</p>
            <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">
              {getFirstImage(slide) ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-surface-border group/img">
                  <img src={getImageUrl(getFirstImage(slide), slide.imageFolder || "banner")} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      onChange(index, "image", "");
                      onChange(index, "imageFolder", "");
                    }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    aria-label="Xóa ảnh banner"
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>delete</span>
                  </button>
                </div>
              ) : (
                <label className="h-28 border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all">
                  <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 24 }}>image</span>
                  <span className="text-xs font-bold text-text-muted mt-1 uppercase">Tải ảnh</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(event) => onUpload(index, event.target.files[0])} />
                </label>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Tiêu đề" value={slide.title || ""} onChange={(value) => onChange(index, "title", value)} placeholder="Ưu đãi thể thao" />
                <Input label="Nút CTA" value={slide.cta || ""} onChange={(value) => onChange(index, "cta", value)} placeholder="Mua ngay" />
                <Input label="Mô tả" value={slide.subtitle || ""} onChange={(value) => onChange(index, "subtitle", value)} placeholder="Thông điệp ngắn trên banner" />
                <Input label="Đường dẫn" value={slide.ctaLink || ""} onChange={(value) => onChange(index, "ctaLink", value)} placeholder="/shop" />
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && <EmptyState icon="image" title="Chưa có banner nào" className="py-8 bg-surface-muted rounded-xl border border-dashed border-surface-border" />}
      </div>
    </Section>
  );
}

function NavigationSettings({ items, onAdd, onRemove, onChange }) {
  return (
    <Section title="Thanh menu" description="Các liên kết hiển thị trên header của website. Đường dẫn nội bộ phải bắt đầu bằng dấu /.">
      <div className="flex justify-end mb-4">
        <button type="button" onClick={onAdd} className="btn-outline text-sm py-1.5 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm liên kết
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-3 border border-surface-border rounded-xl bg-surface-soft">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={item.label} onChange={(event) => onChange(index, "label", event.target.value)} required className="input-field text-sm py-2" placeholder="Tên hiển thị" />
              <input value={item.path} onChange={(event) => onChange(index, "path", event.target.value)} required className="input-field text-sm py-2" placeholder="/shop" />
            </div>
            <button type="button" onClick={() => onRemove(index)} className="p-1 text-text-muted hover:text-danger" aria-label="Xóa liên kết">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CatalogSettings({ brands, targets, categories, onField, onAddCategory, onRemoveCategory, onCategoryChange }) {
  return (
    <Section title="Catalog sản phẩm" description="Quản lý danh mục, thương hiệu và nhóm đối tượng dùng cho trang chủ/cửa hàng.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Textarea label="Danh sách thương hiệu" value={brands} onChange={(value) => onField("brands", value)} placeholder="Yonex, Victor, Lining" />
        <Textarea label="Danh sách đối tượng" value={targets} onChange={(value) => onField("targets", value)} placeholder="Nam, Nữ, Unisex" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-primary">Danh mục trang chủ</h3>
        <button type="button" onClick={onAddCategory} className="btn-outline text-sm py-1.5 px-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm danh mục
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.map((cat, index) => (
          <div key={index} className="p-4 border border-surface-border rounded-xl bg-surface-soft relative">
            <button type="button" onClick={() => onRemoveCategory(index)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-danger" aria-label="Xóa danh mục">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              <Input label="Tên danh mục" value={cat.name} onChange={(value) => onCategoryChange(index, "name", value)} placeholder="Vợt cầu lông" />
              <Input label="Icon Material" value={cat.icon} onChange={(value) => onCategoryChange(index, "icon", value)} placeholder="sports_tennis" />
              <Input label="Đường dẫn" value={cat.path} onChange={(value) => onCategoryChange(index, "path", value)} placeholder="/shop" />
              <Input label="Màu CSS" value={cat.color} onChange={(value) => onCategoryChange(index, "color", value)} placeholder="bg-blue-100 text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ShippingSettings({ shippingFee, freeShipLimit, onField }) {
  return (
    <Section title="Cấu hình vận chuyển" description="Thiết lập phí vận chuyển mặc định và điều kiện miễn phí ship.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input type="number" label="Phí vận chuyển (VND)" value={shippingFee} onChange={(value) => onField("shippingFee", value)} placeholder="30000" />
        <Input type="number" label="Mức miễn phí ship (VND)" value={freeShipLimit} onChange={(value) => onField("freeShipLimit", value)} placeholder="500000" />
      </div>
    </Section>
  );
}

function ContactSettings({ hotline, onField }) {
  return (
    <Section title="Hotline và liên hệ" description="Số điện thoại hiển thị ở header/footer và các điểm hỗ trợ khách hàng.">
      <div className="max-w-sm">
        <Input label="Hotline" value={hotline} onChange={(value) => onField("hotline", value)} placeholder="090 123 4567" />
      </div>
    </Section>
  );
}

function Section({ title, description, children }) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-title font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
      {children}
    </section>
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

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>
      <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="input-field resize-none" placeholder={placeholder} />
    </div>
  );
}

function splitComma(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
