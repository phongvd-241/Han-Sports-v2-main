import { useEffect, useState, useRef } from "react";
import { productApi } from "../../api/productApi";
import { useSettingStore } from "../../store/useSettingStore";
import { getImageUrl, formatVND } from "../../utils/constants";
import { notifySync, syncEvent } from "../../utils/sync";

const EMPTY_FORM = {
  name: "", price: "", quantity: "", brand: "", target: "", category: "",
  shortDesc: "", detailDesc: "", images: [], image: "",
};

const TARGETS = ["Nam", "Nữ", "Unisex", "Trẻ em"];

const getProductFirstImage = (p) => {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    return typeof first === "string" ? first : (first.imageUrl || first.image || "");
  }
  return p.image || "";
};

export default function ProductsPage() {
  const { getSetting } = useSettingStore();
  const CATEGORIES = getSetting("CATEGORIES", []);
  const BRANDS = getSetting("BRANDS", ["Yonex", "Victor", "Lining", "Khác"]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(null); // null | "add" | "edit" | "delete"
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (search) params.filter = `name~'${search}'`;
      const res = await productApi.getAll(params);
      const data = res.data?.data;
      setProducts(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const openAdd = () => { setForm(EMPTY_FORM); setSelectedProduct(null); setModal("add"); };
  const openEdit = (p) => {
    setSelectedProduct(p);
    setForm({
      name: p.name || "", price: String(p.price || ""), quantity: String(p.quantity || ""),
      brand: p.brand || "", target: p.target || "", category: p.category || "",
      shortDesc: p.shortDesc || "", detailDesc: p.detailDesc || "",
      images: p.images ? p.images.map((it) => (typeof it === "string" ? it : (it.imageUrl || it))) : [],
      image: p.image || (Array.isArray(p.images) && p.images.length ? (typeof p.images[0] === "string" ? p.images[0] : (p.images[0].imageUrl || p.images[0])) : ""),
    });
    if (fileRef.current) fileRef.current.value = null;
    setModal("edit");
  };
  const openDelete = (p) => { setSelectedProduct(p); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelectedProduct(null); setForm(EMPTY_FORM); if (fileRef.current) fileRef.current.value = null; };

  const handleReset = () => {
    if (!selectedProduct) return;
    setForm({
      name: selectedProduct.name || "",
      price: String(selectedProduct.price || ""),
      quantity: String(selectedProduct.quantity || ""),
      brand: selectedProduct.brand || "",
      target: selectedProduct.target || "",
      category: selectedProduct.category || "",
      shortDesc: selectedProduct.shortDesc || "",
      detailDesc: selectedProduct.detailDesc || "",
      images: selectedProduct.images ? selectedProduct.images.map((it) => (typeof it === "string" ? it : (it.imageUrl || it))) : [],
      image: selectedProduct.image || (Array.isArray(selectedProduct.images) && selectedProduct.images.length ? (typeof selectedProduct.images[0] === "string" ? selectedProduct.images[0] : (selectedProduct.images[0].imageUrl || selectedProduct.images[0])) : ""),
    });
    showToast("Đã khôi phục dữ liệu ban đầu");
  };

  const removeImage = (idx) => {
    setForm((f) => {
      const images = [...(f.images || [])];
      const removed = images.splice(idx, 1);
      let image = f.image;
      if (removed && removed[0] === image) {
        image = images[0] || "";
      }
      return { ...f, images, image };
    });
  };

  const setMainImage = (img) => {
    setForm((f) => ({ ...f, image: img }));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      // use new API to upload multiple files
      const res = await productApi.uploadFiles(files);
      // backend may return file names under various keys; handle common cases
      const uploaded = res.data?.data?.fileName || res.data?.fileName || res.data?.data?.fileNames || res.data?.fileNames || [];
      const uploadedList = Array.isArray(uploaded) ? uploaded : (uploaded ? [uploaded] : []);
      if (uploadedList.length > 0) {
        setForm((f) => ({ ...f, images: [...(f.images || []), ...uploadedList], image: f.image || uploadedList[0] }));
        showToast("Upload ảnh thành công!");
      } else {
        showToast("Không nhận được tên file trả về", "error");
      }
      if (fileRef.current) fileRef.current.value = null;
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Upload ảnh thất bại!", "error");
    } finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      };
      if (modal === "add") {
        await productApi.create(payload);
        showToast("Thêm sản phẩm thành công!");
      } else {
        await productApi.update({ ...payload, id: selectedProduct.id });
        showToast("Cập nhật sản phẩm thành công!");
      }
      closeModal();
      fetchProducts();
      notifySync(syncEvent.PRODUCT_UPDATED);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu sản phẩm!", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await productApi.remove(selectedProduct.id);
      showToast("Đã xóa sản phẩm!");
      closeModal();
      fetchProducts();
    } catch { showToast("Xóa sản phẩm thất bại!", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-modal text-sm font-semibold flex items-center gap-2 animate-fade-up ${toast.type === "success" ? "bg-brand-green text-white" : "bg-danger text-white"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">{totalElements} sản phẩm</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Tìm kiếm sản phẩm..."
          className="input-field pl-10 py-2 text-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Ảnh</th>
                <th className="px-4 py-3 text-left">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-left">Thương hiệu</th>
                <th className="px-4 py-3 text-right">Giá</th>
                <th className="px-4 py-3 text-right">Tồn kho</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-8 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-text-muted">
                    <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inventory_2</span>
                    <p className="mt-2 font-semibold">Không có sản phẩm nào</p>
                  </td>
                </tr>
              ) : products.map((p, i) => (
                <tr key={p.id} className="hover:bg-surface-soft transition-colors">
                  <td className="px-4 py-3 text-text-muted text-xs">{page * 10 + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-muted overflow-hidden flex-shrink-0">
                      {getProductFirstImage(p)
                        ? <img src={getImageUrl(getProductFirstImage(p))} alt={p.name} className="w-full h-full object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center text-text-muted"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>image_not_supported</span></div>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-primary line-clamp-1">{p.name}</p>
                    {p.target && <p className="text-xs text-text-muted mt-0.5">{p.target}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? <span className="px-2 py-1 bg-surface-muted rounded text-[10px] font-bold uppercase">{p.category}</span> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.brand ? <span className="badge-blue">{p.brand}</span> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand-blue">{formatVND(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.quantity > 0 ? "badge-green" : "badge-danger"}>{p.quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-brand-blue hover:bg-brand-blue-light transition-all" title="Sửa">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                      </button>
                      <button onClick={() => openDelete(p)} className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-all" title="Xóa">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-xs text-text-muted">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 transition-all">
                ← Trước
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-semibold hover:border-brand-blue hover:text-brand-blue disabled:opacity-40 transition-all">
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-text-primary">
                {modal === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-muted transition-all text-text-muted">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Product name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Tên sản phẩm *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Vợt cầu lông Yonex..." className="input-field" />
                </div>
                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Giá (VNĐ) *</label>
                  <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="1500000" className="input-field" />
                </div>
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Tồn kho *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="100" className="input-field" />
                </div>
                {/* Brand */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Thương hiệu</label>
                  <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field">
                    <option value="">-- Chọn thương hiệu --</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Danh mục</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                {/* Target */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Đối tượng</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="input-field">
                    <option value="">-- Chọn đối tượng --</option>
                    {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* Short Desc */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Mô tả ngắn *</label>
                  <input required value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                    placeholder="Mô tả ngắn gọn về sản phẩm..." className="input-field" />
                </div>
                {/* Detail Desc */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Mô tả chi tiết *</label>
                  <textarea required rows={4} value={form.detailDesc} onChange={(e) => setForm({ ...form, detailDesc: e.target.value })}
                    placeholder="Mô tả chi tiết về sản phẩm..." className="input-field resize-none" />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Ảnh sản phẩm</label>
                  <div className="flex gap-4 items-start">
                    {/* Preview */}
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-border bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {form.images && form.images.length > 0 ? (
                        <div className="w-full h-full grid grid-cols-1 gap-0">
                          <img src={getImageUrl(form.image || form.images[0])} alt="Preview" className="w-full h-full object-contain p-2" />
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 32 }}>image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="btn-outline py-2 px-4 text-sm disabled:opacity-50">
                        {uploading
                          ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang upload...</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span> Chọn ảnh</>
                        }
                      </button>
                      <p className="text-xs text-text-muted mt-2">JPG, PNG, WebP. Tối đa 5MB.</p>
                      {form.images && form.images.length > 0 && (
                        <div className="text-xs text-brand-green mt-1 flex flex-col gap-2">
                          <p className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                            {form.images.length} ảnh đã chọn
                          </p>
                          <div className="flex gap-2 overflow-x-auto items-center">
                            {form.images.map((img, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-surface-muted rounded px-2 py-1">
                                <img src={getImageUrl(img)} alt={img} className="w-8 h-8 object-contain" />
                                <div className="flex flex-col text-[11px]">
                                  <span className="truncate max-w-[120px]">{img}</span>
                                  <div className="flex gap-1 mt-0.5">
                                    <button type="button" onClick={() => setMainImage(img)} className={`text-[11px] px-2 py-0.5 rounded ${form.image === img ? 'bg-brand-blue text-white' : 'bg-white text-text-muted border'}`}>
                                      {form.image === img ? 'Ảnh chính' : 'Đặt ảnh chính'}
                                    </button>
                                    <button type="button" onClick={() => removeImage(idx)} className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-danger">
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-surface-border">
                {modal === "edit" && (
                  <button type="button" onClick={handleReset} className="btn-ghost px-4 py-2.5 text-text-muted hover:text-brand-blue flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restart_alt</span>
                    Khôi phục
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={closeModal} className="btn-ghost px-6 py-2.5 border border-surface-border rounded-xl">Hủy</button>
                <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-60">
                  {saving
                    ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang lưu...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> {modal === "add" ? "Thêm sản phẩm" : "Lưu thay đổi"}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modal === "delete" && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-8 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-danger" style={{ fontSize: 32 }}>delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Xác nhận xóa sản phẩm?</h3>
            <p className="text-text-muted text-sm mb-6">
              Bạn sắp xóa <strong>"{selectedProduct.name}"</strong>. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 btn-ghost py-2.5 border border-surface-border rounded-xl">Hủy</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 bg-danger text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> : null}
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}