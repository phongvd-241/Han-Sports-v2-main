import { useState, useEffect } from "react";
import { useSettingStore } from "../../store/useSettingStore";
import { settingApi } from "../../api/settingApi";
import { productApi } from "../../api/productApi";
import { notifySync, syncEvent } from "../../utils/sync";
import { getImageUrl, getFirstImage } from "../../utils/constants";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { settings, getSetting, refreshSettings } = useSettingStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        hotline: getSetting("HOTLINE", "090 123 4567"),
        shippingFee: getSetting("SHIPPING_FEE", "30000"),
        freeShipLimit: getSetting("FREE_SHIP_LIMIT", "500000"),
        brands: (getSetting("BRANDS", [])).join(", "),
        targets: (getSetting("TARGETS", [])).join(", "),
        slides: getSetting("HERO_SLIDES", []),
        categories: getSetting("CATEGORIES", []),
        headerNav: getSetting("HEADER_NAV", []),
      });
    }
  }, [settings]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...form.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setForm({ ...form, slides: newSlides });
  };

  const addSlide = () => {
    setForm({ ...form, slides: [...form.slides, { title: "", subtitle: "", cta: "", ctaLink: "", bg: "from-brand-blue via-brand-teal to-brand-green" }] });
  };

  const removeSlide = (index) => {
    const newSlides = [...form.slides];
    newSlides.splice(index, 1);
    setForm({ ...form, slides: newSlides });
  };

  const handleBannerUpload = async (index, file) => {
    if (!file) return;
    const t = toast.loading("Đang tải ảnh lên...");
    try {
      const res = await productApi.uploadFile(file);
      handleSlideChange(index, "image", res.data?.data?.fileName);
      toast.success("Tải ảnh lên thành công!", { id: t });
    } catch (err) {
      toast.error("Tải ảnh thất bại!", { id: t });
      console.error(err);
    }
  };

  const handleCategoryChange = (index, field, value) => {
    const newCats = [...form.categories];
    newCats[index] = { ...newCats[index], [field]: value };
    setForm({ ...form, categories: newCats });
  };

  const addCategory = () => {
    setForm({ ...form, categories: [...form.categories, { name: "", icon: "category", path: "/shop", color: "bg-surface-muted text-text-primary" }] });
  };

  const removeCategory = (index) => {
    const newCats = [...form.categories];
    newCats.splice(index, 1);
    setForm({ ...form, categories: newCats });
  };

  const handleHeaderNavChange = (index, field, value) => {
    const newNav = [...form.headerNav];
    newNav[index] = { ...newNav[index], [field]: value };
    setForm({ ...form, headerNav: newNav });
  };

  const addHeaderNav = () => {
    setForm({ ...form, headerNav: [...form.headerNav, { label: "", path: "/shop" }] });
  };

  const removeHeaderNav = (index) => {
    const newNav = [...form.headerNav];
    newNav.splice(index, 1);
    setForm({ ...form, headerNav: newNav });
  };

  const handleRevert = () => {
    if (!settings) return;
    setForm({
      hotline: getSetting("HOTLINE", "090 123 4567"),
      shippingFee: getSetting("SHIPPING_FEE", "30000"),
      freeShipLimit: getSetting("FREE_SHIP_LIMIT", "500000"),
      brands: (getSetting("BRANDS", [])).join(", "),
      targets: (getSetting("TARGETS", [])).join(", "),
      slides: getSetting("HERO_SLIDES", []),
      categories: getSetting("CATEGORIES", []),
      headerNav: getSetting("HEADER_NAV", []),
    });
    toast.success("Đã khôi phục dữ liệu gốc!");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = [
        { settingKey: "HOTLINE", settingValue: form.hotline },
        { settingKey: "SHIPPING_FEE", settingValue: form.shippingFee },
        { settingKey: "FREE_SHIP_LIMIT", settingValue: form.freeShipLimit },
        { settingKey: "BRANDS", settingValue: JSON.stringify(form.brands.split(",").map(s => s.trim()).filter(s => s)) },
        { settingKey: "TARGETS", settingValue: JSON.stringify(form.targets.split(",").map(s => s.trim()).filter(s => s)) },
        { settingKey: "HERO_SLIDES", settingValue: JSON.stringify(form.slides) },
        { settingKey: "CATEGORIES", settingValue: JSON.stringify(form.categories) },
        { settingKey: "HEADER_NAV", settingValue: JSON.stringify(form.headerNav) }
      ];
      await settingApi.updateBulkSettings(updates);
      await refreshSettings();
      notifySync(syncEvent.SETTING_UPDATED);
      toast.success("Cập nhật cấu hình thành công!");
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu cấu hình!");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-blue">settings</span>
        Cấu hình Hệ thống
      </h1>

      <form onSubmit={handleSave} className="card p-6 flex flex-col gap-6">

        {/* Banners */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title font-bold text-text-primary mb-1">Banner Trang Chủ (Hero Slides)</h2>
              <p className="text-sm text-text-muted">Các banner quảng cáo trượt ở đầu trang chủ.</p>
            </div>
            <button type="button" onClick={addSlide} className="btn-outline text-sm py-1.5 px-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Thêm Banner
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {form.slides.map((slide, i) => (
              <div key={i} className="p-4 border border-surface-border rounded-xl bg-surface-muted relative group">
                <button type="button" onClick={() => removeSlide(i)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
                <p className="text-xs font-bold text-text-muted mb-4 uppercase tracking-wider">Banner {i + 1}</p>
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-text-secondary mb-2">Hình ảnh Banner (Nên sử dụng ảnh rộng 1200x600px)</label>
                    <div className="flex items-center gap-6">
                      {getFirstImage(slide) ? (
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-surface-border group/img">
                          <img src={getImageUrl(getFirstImage(slide))} alt="Banner" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleSlideChange(i, "image", "")} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>delete</span>
                          </button>
                        </div>
                      ) : (
                        <label className="w-32 h-20 border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue-light/30 transition-all">
                          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 20 }}>image</span>
                          <span className="text-[10px] font-bold text-text-muted mt-1 uppercase">Tải ảnh</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBannerUpload(i, e.target.files[0])} />
                        </label>
                      )}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Đường dẫn khi ấn vào banner (Ví dụ: /shop)</label>
                        <input
                          value={slide.ctaLink || ""}
                          onChange={(e) => handleSlideChange(i, "ctaLink", e.target.value)}
                          className="input-field text-xs py-2"
                          placeholder="Nhập link liên kết..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {form.slides.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4 bg-surface-muted rounded-xl border border-dashed border-surface-border">Chưa có banner nào.</p>
            )}
          </div>
        </div>

        <hr className="border-surface-border" />

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title font-bold text-text-primary mb-1">Danh mục Sản phẩm (Trang chủ)</h2>
              <p className="text-sm text-text-muted">Các danh mục hiển thị dưới banner trang chủ.</p>
            </div>
            <button type="button" onClick={addCategory} className="btn-outline text-sm py-1.5 px-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Thêm Danh mục
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.categories.map((cat, i) => (
              <div key={i} className="p-4 border border-surface-border rounded-xl bg-surface-soft relative group">
                <button type="button" onClick={() => removeCategory(i)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Tên danh mục</label>
                    <input value={cat.name} onChange={(e) => handleCategoryChange(i, "name", e.target.value)} required className="input-field text-sm py-1.5" placeholder="Vợt cầu lông" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Icon (Material)</label>
                    <input value={cat.icon} onChange={(e) => handleCategoryChange(i, "icon", e.target.value)} required className="input-field text-sm py-1.5" placeholder="category" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Đường dẫn (Path)</label>
                    <input value={cat.path} onChange={(e) => handleCategoryChange(i, "path", e.target.value)} required className="input-field text-sm py-1.5" placeholder="/shop" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Màu sắc (Tailwind)</label>
                    <input value={cat.color} onChange={(e) => handleCategoryChange(i, "color", e.target.value)} className="input-field text-sm py-1.5" placeholder="bg-blue-100 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-surface-border" />

        {/* Header Nav */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title font-bold text-text-primary mb-1">Thanh Menu (Header)</h2>
              <p className="text-sm text-text-muted">Các liên kết hiển thị trên thanh menu đầu trang.</p>
            </div>
            <button type="button" onClick={addHeaderNav} className="btn-outline text-sm py-1.5 px-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Thêm Liên kết
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {form.headerNav.map((nav, i) => (
              <div key={i} className="flex items-center gap-2 p-3 border border-surface-border rounded-xl bg-surface-soft group">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input value={nav.label} onChange={(e) => handleHeaderNavChange(i, "label", e.target.value)} required className="input-field text-sm py-1" placeholder="Tên hiển thị" />
                  <input value={nav.path} onChange={(e) => handleHeaderNavChange(i, "path", e.target.value)} required className="input-field text-sm py-1" placeholder="Link (/shop...)" />
                </div>
                <button type="button" onClick={() => removeHeaderNav(i)} className="p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-surface-border" />

        {/* Hotline */}
        <div>
          <h2 className="text-title font-bold text-text-primary mb-1">Hotline & Liên hệ</h2>
          <p className="text-sm text-text-muted mb-4">Số điện thoại hiển thị trên Header và Footer.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Hotline</label>
              <input name="hotline" value={form.hotline} onChange={handleChange} required className="input-field" placeholder="090 123 4567" />
            </div>
          </div>
        </div>

        <hr className="border-surface-border" />

        {/* Shipping */}
        <div>
          <h2 className="text-title font-bold text-text-primary mb-1">Cấu hình Vận chuyển</h2>
          <p className="text-sm text-text-muted mb-4">Mức phí ship mặc định và điều kiện miễn phí ship.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Phí vận chuyển (VNĐ)</label>
              <input name="shippingFee" type="number" min="0" value={form.shippingFee} onChange={handleChange} required className="input-field" placeholder="30000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Mức Free Ship (VNĐ)</label>
              <input name="freeShipLimit" type="number" min="0" value={form.freeShipLimit} onChange={handleChange} required className="input-field" placeholder="500000" />
              <p className="text-xs text-text-muted mt-1">Đơn hàng đạt mức này sẽ được miễn phí vận chuyển.</p>
            </div>
          </div>
        </div>

        <hr className="border-surface-border" />

        {/* Filters */}
        <div>
          <h2 className="text-title font-bold text-text-primary mb-1">Bộ lọc Cửa hàng</h2>
          <p className="text-sm text-text-muted mb-4">Danh sách các giá trị dùng để lọc sản phẩm, cách nhau bởi dấu phẩy (,).</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Danh sách Thương hiệu</label>
              <textarea name="brands" rows={2} value={form.brands} onChange={handleChange} required className="input-field resize-none" placeholder="Yonex, Victor, Lining, ..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Danh sách Đối tượng</label>
              <input name="targets" value={form.targets} onChange={handleChange} required className="input-field" placeholder="Nam, Nữ, Unisex, ..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 border-t border-surface-border">
          <button type="button" onClick={handleRevert} className="btn-ghost text-text-muted hover:text-brand-blue flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>restart_alt</span>
            Khôi phục thay đổi
          </button>
          <div className="flex-1" />
          <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-base disabled:opacity-60">
            {saving ? (
              <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Đang lưu...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span> Lưu Cấu hình</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
