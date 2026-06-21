import { useState } from "react";
import FormModal from "../../../components/admin/FormModal";
import ProductGalleryManager from "./ProductGalleryManager";
import { TARGETS } from "./productFormUtils";

export default function ProductFormModal({
  modal,
  form,
  setForm,
  saving,
  uploading,
  categories = [],
  brands = [],
  onClose,
  onSave,
  onReset,
  descriptionFileRef,
  onDescriptionImport,
  fileRef,
  onUpload,
  onRemove,
  onSetMain,
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const tabs = [
    { id: "basic", label: "Thông tin cơ bản", icon: "info" },
    { id: "pricing", label: "Giá & tồn kho", icon: "payments" },
    { id: "classification", label: "Phân loại", icon: "category" },
    { id: "images", label: "Hình ảnh", icon: "image" },
    { id: "description", label: "Mô tả", icon: "description" },
  ];

  // Logic kiểm tra lỗi đơn giản để hiển thị dấu báo lỗi trên tab header
  const hasBasicError = submitAttempted && (!form.name || !form.name.trim());
  const hasPricingError = submitAttempted && (
    !form.price || Number(form.price) <= 0 || !form.quantity || Number(form.quantity) < 0
  );
  const hasDescriptionError = submitAttempted && (
    !form.shortDesc || !form.shortDesc.trim() || !form.detailDesc || !form.detailDesc.trim()
  );

  const handleFieldInvalid = (tabId) => {
    setActiveTab(tabId);
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    setForm((f) => {
      const images = [...(f.images || [])];
      const temp = images[idx];
      images[idx] = images[idx - 1];
      images[idx - 1] = temp;
      return { ...f, images };
    });
  };

  const handleMoveDown = (idx) => {
    setForm((f) => {
      const images = [...(f.images || [])];
      if (idx === images.length - 1) return f;
      const temp = images[idx];
      images[idx] = images[idx + 1];
      images[idx + 1] = temp;
      return { ...f, images };
    });
  };

  return (
    <FormModal
      title={modal === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
      onClose={onClose}
      busy={saving || uploading}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={(e) => { setSubmitAttempted(true); onSave(e); }} className="relative flex flex-col min-h-[400px]">
        {/* Tab Header - Cố định bên dưới Modal Header */}
        <div className="flex border-b border-surface-border overflow-x-auto scrollbar-none flex-nowrap px-6 pt-2 sticky top-[61px] bg-white z-20 gap-1 md:gap-2 flex-shrink-0">
          {tabs.map((tab) => {
            let hasError = false;
            if (tab.id === "basic") hasError = hasBasicError;
            if (tab.id === "pricing") hasError = hasPricingError;
            if (tab.id === "description") hasError = hasDescriptionError;

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-brand-green text-brand-green bg-brand-green/5"
                    : "border-transparent text-text-muted hover:text-text-primary hover:border-surface-border"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
                {hasError && (
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" title="Vui lòng kiểm tra thông tin" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6">
          {/* TAB 1: THÔNG TIN CƠ BẢN */}
          <div className={activeTab === "basic" ? "grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in" : "hidden"}>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-secondary mb-2">Tên sản phẩm *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onInvalid={() => handleFieldInvalid("basic")}
                placeholder="Vợt cầu lông Yonex Arcsaber 11 Pro..."
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-text-secondary">SKU</label>
                <button
                  type="button"
                  onClick={() => {
                    const randNum = Math.floor(100000 + Math.random() * 900000);
                    setForm((prev) => ({ ...prev, sku: `SHOPVNB-VNB${randNum}` }));
                  }}
                  className="text-xs text-brand-blue font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
                  Tạo SKU ngẫu nhiên
                </button>
              </div>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SHOPVNB-VNB026679"
                className="input-field font-mono focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Thương hiệu</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="input-field focus:border-brand-green"
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Đối tượng sử dụng</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="input-field focus:border-brand-green"
              >
                <option value="">-- Chọn đối tượng --</option>
                {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* TAB 2: GIÁ & TỒN KHO */}
          <div className={activeTab === "pricing" ? "grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in" : "hidden"}>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Giá bán (VNĐ) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                onInvalid={() => handleFieldInvalid("pricing")}
                placeholder="1500000"
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Giá gốc / niêm yết (VNĐ)</label>
              <input
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                onInvalid={() => handleFieldInvalid("pricing")}
                placeholder="1800000"
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
              <p className="mt-1 text-xs text-text-muted">Nếu lớn hơn giá bán, web sẽ hiển thị giá gốc bị gạch ngang.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Tồn kho *</label>
              <input
                required
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                onInvalid={() => handleFieldInvalid("pricing")}
                placeholder="100"
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
          </div>

          {/* TAB 3: PHÂN LOẠI */}
          <div className={activeTab === "classification" ? "grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in" : "hidden"}>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field focus:border-brand-green"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Tùy chọn màu sắc</label>
              <input
                value={form.colorOptions}
                onChange={(e) => setForm({ ...form, colorOptions: e.target.value })}
                placeholder="Đen, Trắng, Đỏ"
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
              <p className="mt-1 text-xs text-text-muted">Các màu sắc ngăn cách bằng dấu phẩy.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Tùy chọn kích cỡ (Size)</label>
              <input
                value={form.sizeOptions}
                onChange={(e) => setForm({ ...form, sizeOptions: e.target.value })}
                placeholder="3U, 4U, 39, 40, M, L"
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
              <p className="mt-1 text-xs text-text-muted">Các size ngăn cách bằng dấu phẩy.</p>
            </div>
          </div>

          {/* TAB 4: HÌNH ẢNH */}
          <div className={activeTab === "images" ? "block animate-fade-in" : "hidden"}>
            <ProductGalleryManager
              images={form.images}
              uploading={uploading}
              fileRef={fileRef}
              onUpload={onUpload}
              onRemove={onRemove}
              onSetMain={onSetMain}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>

          {/* TAB 5: MÔ TẢ */}
          <div className={activeTab === "description" ? "grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in" : "hidden"}>
            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-surface-border px-4 py-3 bg-surface-soft">
              <div>
                <p className="text-sm font-semibold text-text-secondary">Trạng thái hiển thị sản phẩm</p>
                <p className="text-xs text-text-muted">Cho phép sản phẩm xuất hiện trên cửa hàng và kết quả tìm kiếm.</p>
              </div>
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-5 w-5 accent-brand-green cursor-pointer"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-text-secondary mb-2">Mô tả ngắn *</label>
              <input
                required
                value={form.shortDesc}
                onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                onInvalid={() => handleFieldInvalid("description")}
                placeholder="Nhập đoạn mô tả ngắn gọn thu hút khách hàng..."
                className="input-field focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-semibold text-text-secondary">Mô tả chi tiết *</label>
                <div>
                  <input
                    ref={descriptionFileRef}
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    className="hidden"
                    onChange={onDescriptionImport}
                  />
                  <button
                    type="button"
                    onClick={() => descriptionFileRef.current?.click()}
                    className="btn-ghost px-3 py-1.5 text-xs border border-surface-border hover:bg-surface-soft hover:text-brand-green transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                    Nhập từ file
                  </button>
                </div>
              </div>
              <textarea
                required
                rows={8}
                value={form.detailDesc}
                onChange={(e) => setForm({ ...form, detailDesc: e.target.value })}
                onInvalid={() => handleFieldInvalid("description")}
                placeholder={"Nhập mô tả theo từng đoạn.\n\nDùng dòng bắt đầu bằng # cho tiêu đề và - cho danh sách."}
                className="input-field resize-y leading-7 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
              />
              <p className="mt-1.5 text-xs text-text-muted">
                Hỗ trợ file TXT/Markdown tối đa 1MB. Nội dung được hiển thị định dạng chuẩn trên trang chi tiết sản phẩm.
              </p>
            </div>
          </div>
        </div>

        {/* Footer cố định ở đáy Modal */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-surface-border sticky bottom-0 bg-white z-20 flex-shrink-0 rounded-b-xl">
          {modal === "edit" && (
            <button
              type="button"
              onClick={onReset}
              className="btn-ghost px-4 py-2.5 text-text-muted hover:text-brand-green hover:bg-brand-green/5 flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
              Khôi phục
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-6 py-2.5 border border-surface-border rounded-xl hover:bg-surface-soft"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-2.5 px-6 disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang lưu...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> {modal === "add" ? "Thêm sản phẩm" : "Lưu thay đổi"}
              </>
            )}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
