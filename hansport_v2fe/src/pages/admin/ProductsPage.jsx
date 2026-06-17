import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { productApi } from "../../api/productApi";
import AdminMetricCard from "../../components/admin/AdminMetricCard";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminToolbar from "../../components/admin/AdminToolbar";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import FormModal from "../../components/admin/FormModal";
import IconButton from "../../components/admin/IconButton";
import ProductImportPanel from "../../components/admin/ProductImportPanel";
import { useSettingStore } from "../../store/useSettingStore";
import { getImageUrl, formatVND } from "../../utils/constants";
import { notifySync, syncEvent } from "../../utils/sync";

const EMPTY_FORM = {
  sku: "", name: "", price: "", originalPrice: "", quantity: "", brand: "", target: "", category: "",
  shortDesc: "", detailDesc: "", active: true, images: [],
  colorOptions: "", sizeOptions: "",
};
const MAX_PRODUCT_IMAGES = 8;

const TARGETS = ["Nam", "Nữ", "Unisex", "Trẻ em"];
const PRODUCT_COLUMNS = [
  { key: "index", label: "#", className: "px-4 py-3 text-left w-12", skeletonClassName: "h-8" },
  { key: "image", label: "Ảnh", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "name", label: "Tên sản phẩm", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "category", label: "Danh mục", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "brand", label: "Thương hiệu", className: "px-4 py-3 text-left", skeletonClassName: "h-8" },
  { key: "price", label: "Giá", className: "px-4 py-3 text-right", skeletonClassName: "h-8" },
  { key: "stock", label: "Tồn kho", className: "px-4 py-3 text-right", skeletonClassName: "h-8" },
  { key: "actions", label: "Thao tác", className: "px-4 py-3 text-center", skeletonClassName: "h-8" },
];

const getProductFirstImage = (p) => {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    return typeof first === "string" ? first : (first.imageUrl || first.image || "");
  }
  return p.image || "";
};

const optionText = (value) => Array.isArray(value) ? value.join(", ") : (value || "");
const parseOptions = (value) => String(value || "")
  .split(/[;,|\n\r]+/)
  .map((item) => item.trim())
  .filter(Boolean);

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
  const [selectedIds, setSelectedIds] = useState([]);

  const [modal, setModal] = useState(null); // null | "add" | "edit" | "delete" | "import" | "delete_bulk"
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const fileRef = useRef();
  const descriptionFileRef = useRef();

  const showToast = (msg, type = "success") => {
    if (type === "error") {
      toast.error(msg);
      return;
    }
    toast.success(msg);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10, includeInactive: true };
      if (search) params.q = search;
      const res = await productApi.getAll(params);
      const data = res.data?.data;
      setProducts(data?.result || []);
      setTotalPages(data?.meta?.pages || 1);
      setTotalElements(data?.meta?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search]);

  const openAdd = () => { setForm(EMPTY_FORM); setSelectedProduct(null); setModal("add"); };
  const openEdit = (p) => {
    setSelectedProduct(p);
    setForm({
      sku: p.sku || "",
      name: p.name || "", price: String(p.price || ""), originalPrice: p.originalPrice ? String(p.originalPrice) : "", quantity: String(p.quantity || ""),
      brand: p.brand || "", target: p.target || "", category: p.category || "",
      shortDesc: p.shortDesc || "", detailDesc: p.detailDesc || "", active: p.active ?? true,
      images: p.images ? p.images.map((it) => (typeof it === "string" ? it : (it.imageUrl || it))) : [],
      colorOptions: optionText(p.colorOptions),
      sizeOptions: optionText(p.sizeOptions),
    });
    if (fileRef.current) fileRef.current.value = null;
    setModal("edit");
  };
  const openDelete = (p) => { setSelectedProduct(p); setModal("delete"); };
  const closeModal = () => {
    setModal(null);
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    if (fileRef.current) fileRef.current.value = null;
    if (descriptionFileRef.current) descriptionFileRef.current.value = null;
  };

  const handleReset = () => {
    if (!selectedProduct) return;
    setForm({
      sku: selectedProduct.sku || "",
      name: selectedProduct.name || "",
      price: String(selectedProduct.price || ""),
      originalPrice: selectedProduct.originalPrice ? String(selectedProduct.originalPrice) : "",
      quantity: String(selectedProduct.quantity || ""),
      brand: selectedProduct.brand || "",
      target: selectedProduct.target || "",
      category: selectedProduct.category || "",
      shortDesc: selectedProduct.shortDesc || "",
      detailDesc: selectedProduct.detailDesc || "",
      active: selectedProduct.active ?? true,
      images: selectedProduct.images ? selectedProduct.images.map((it) => (typeof it === "string" ? it : (it.imageUrl || it))) : [],
      colorOptions: optionText(selectedProduct.colorOptions),
      sizeOptions: optionText(selectedProduct.sizeOptions),
    });
    showToast("Đã khôi phục dữ liệu ban đầu");
  };

  const removeImage = (idx) => {
    setForm((f) => {
      const images = [...(f.images || [])];
      images.splice(idx, 1);
      return { ...f, images };
    });
  };

  const setMainImage = (img) => {
    setForm((f) => ({
      ...f,
      images: [img, ...(f.images || []).filter((item) => item !== img)],
    }));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if ((form.images?.length || 0) + files.length > MAX_PRODUCT_IMAGES) {
      showToast(`Mỗi sản phẩm được chọn tối đa ${MAX_PRODUCT_IMAGES} ảnh.`, "error");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const res = await productApi.uploadFiles(files);
      const uploaded = res.data?.data?.fileName || res.data?.fileName || res.data?.data?.fileNames || res.data?.fileNames || [];
      const uploadedList = Array.isArray(uploaded) ? uploaded : (uploaded ? [uploaded] : []);
      if (uploadedList.length > 0) {
        setForm((f) => ({
          ...f,
          images: [...new Set([...(f.images || []), ...uploadedList])],
        }));
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

  const handleDescriptionImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showToast("File mô tả không được vượt quá 1MB.", "error");
      event.target.value = "";
      return;
    }
    try {
      const content = (await file.text()).replace(/\r\n/g, "\n").trim();
      if (!content) {
        showToast("File mô tả không có nội dung.", "error");
        return;
      }
      setForm((current) => ({
        ...current,
        detailDesc: content,
        shortDesc: current.shortDesc || content.replace(/\s+/g, " ").slice(0, 220),
      }));
      showToast("Đã nhập nội dung mô tả từ file.");
    } catch {
      showToast("Không thể đọc file mô tả.", "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalSku = form.sku;
      if (!finalSku || !finalSku.trim()) {
        const randNum = Math.floor(100000 + Math.random() * 900000);
        finalSku = `SHOPVNB-VNB${randNum}`;
      }

      const priceVal = Number(form.price);
      let finalOriginalPrice = form.originalPrice;
      if (!finalOriginalPrice || Number(finalOriginalPrice) <= 0) {
        const factor = 1.2 + Math.random() * 0.4;
        finalOriginalPrice = String(Math.floor((priceVal * factor) / 50000) * 50000);
      }

      let finalColors = form.colorOptions;
      if (!finalColors || !finalColors.trim()) {
        const colorList = ["Đen", "Trắng", "Xanh dương", "Đỏ", "Vàng", "Hồng", "Cam", "Tím", "Xanh lá", "Navy"];
        const count = Math.floor(Math.random() * 2) + 1;
        const selected = [];
        for (let i = 0; i < count; i++) {
          const col = colorList[Math.floor(Math.random() * colorList.length)];
          if (!selected.includes(col)) selected.push(col);
        }
        finalColors = selected.join(", ");
      }

      let finalSizes = form.sizeOptions;
      if (!finalSizes || !finalSizes.trim()) {
        const lowercaseName = (form.name || "").toLowerCase();
        const lowercaseCategory = (form.category || "").toLowerCase();
        
        if (lowercaseName.includes("vợt") || lowercaseCategory.includes("vợt")) {
          const racketSizes = ["3U", "4U", "5U", "3U, 4U", "4U, 5U"];
          finalSizes = racketSizes[Math.floor(Math.random() * racketSizes.length)];
        } else if (lowercaseName.includes("giày") || lowercaseCategory.includes("giày")) {
          const shoeSizes = ["39, 40, 41", "40, 41, 42", "41, 42, 43", "38, 39, 40"];
          finalSizes = shoeSizes[Math.floor(Math.random() * shoeSizes.length)];
        } else if (lowercaseName.includes("áo") || lowercaseName.includes("quần") || lowercaseCategory.includes("áo") || lowercaseCategory.includes("quần") || lowercaseCategory.includes("trang phục")) {
          const clothingSizes = ["M, L, XL", "S, M, L", "L, XL"];
          finalSizes = clothingSizes[Math.floor(Math.random() * clothingSizes.length)];
        } else {
          finalSizes = "Free Size";
        }
      }

      const payload = {
        ...form,
        sku: finalSku,
        price: priceVal,
        originalPrice: Number(finalOriginalPrice),
        quantity: Number(form.quantity),
        colorOptions: parseOptions(finalColors),
        sizeOptions: parseOptions(finalSizes),
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

  const handleDeleteBulk = async () => {
    setSaving(true);
    try {
      await Promise.all(selectedIds.map((id) => productApi.remove(id)));
      showToast(`Đã xóa ${selectedIds.length} sản phẩm thành công!`);
      setSelectedIds([]);
      closeModal();
      fetchProducts();
      notifySync(syncEvent.PRODUCT_UPDATED);
    } catch (err) {
      console.error(err);
      showToast("Xóa sản phẩm thất bại!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  const dynamicColumns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={handleSelectAll}
          className="w-4 h-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue cursor-pointer"
        />
      ),
      className: "px-4 py-3 text-center w-10",
      skeletonClassName: "h-8"
    },
    ...PRODUCT_COLUMNS
  ];


  const lowStockOnPage = products.filter((item) => (item.quantity || 0) > 0 && (item.quantity || 0) <= 5).length;
  const outOfStockOnPage = products.filter((item) => (item.quantity || 0) <= 0).length;
  const withImagesOnPage = products.filter((item) => Boolean(getProductFirstImage(item))).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Sản phẩm"
        description={`${totalElements} sản phẩm trong danh mục`}
        actions={(
          <button type="button" onClick={openAdd} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Thêm sản phẩm
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminMetricCard icon="inventory_2" label="Tổng sản phẩm" value={totalElements.toLocaleString("vi-VN")} hint="Theo kết quả API" tone="blue" />
        <AdminMetricCard icon="widgets" label="Đang hiển thị" value={products.length.toLocaleString("vi-VN")} hint={`Trang ${page + 1}/${totalPages}`} tone="teal" />
        <AdminMetricCard icon="image" label="Có ảnh" value={withImagesOnPage.toLocaleString("vi-VN")} hint="Trong trang hiện tại" tone="green" />
        <AdminMetricCard
          icon={outOfStockOnPage > 0 ? "error" : "warning"}
          label="Cần chú ý"
          value={`${outOfStockOnPage} hết hàng`}
          hint={`${lowStockOnPage} sắp hết trong trang này`}
          tone={outOfStockOnPage > 0 ? "danger" : "amber"}
        />
      </div>

      <AdminToolbar>
        <div className="relative w-full max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted" style={{ fontSize: 18 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm kiếm sản phẩm..."
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setModal("delete_bulk")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-danger hover:opacity-90 transition-all duration-200 text-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
              Xóa {selectedIds.length} đã chọn
            </button>
          )}
          <button type="button" onClick={() => setModal("import")} className="btn-outline py-2 px-4 text-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>upload_file</span>
            Import Excel/CSV
          </button>
        </div>
      </AdminToolbar>

      <DataTable
        columns={dynamicColumns}
        loading={loading}
        isEmpty={products.length === 0}
        emptyIcon="inventory_2"
        emptyTitle="Không có sản phẩm nào"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        {products.map((p, i) => (
          <tr key={p.id} className="hover:bg-surface-soft transition-colors">
            <td className="px-4 py-3 text-center w-10">
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => handleSelectRow(p.id)}
                className="w-4 h-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue cursor-pointer"
              />
            </td>
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
              {p.sku && <p className="text-[11px] text-text-muted font-mono mt-0.5">{p.sku}</p>}
              {p.target && <p className="text-xs text-text-muted mt-0.5">{p.target}</p>}
              {p.active === false && <span className="badge-danger mt-1 inline-flex">Hidden</span>}
            </td>
            <td className="px-4 py-3">
              {p.category ? <span className="px-2 py-1 bg-surface-muted rounded text-[10px] font-bold uppercase">{p.category}</span> : <span className="text-text-muted">-</span>}
            </td>
            <td className="px-4 py-3">
              {p.brand ? <span className="badge-blue">{p.brand}</span> : <span className="text-text-muted">-</span>}
            </td>
            <td className="px-4 py-3 text-right">
              <p className="font-bold text-brand-blue">{formatVND(p.price)}</p>
              {Number(p.originalPrice || 0) > Number(p.price || 0) && (
                <p className="text-[11px] text-text-muted line-through">{formatVND(p.originalPrice)}</p>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              <span className={p.quantity > 0 ? "badge-green" : "badge-danger"}>{p.quantity}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <IconButton icon="edit" label="Sửa sản phẩm" variant="primary" onClick={() => openEdit(p)} />
                <IconButton icon="delete" label="Xóa sản phẩm" variant="danger" onClick={() => openDelete(p)} />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {(modal === "add" || modal === "edit") && (
        <FormModal
          title={modal === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
          onClose={closeModal}
          busy={saving || uploading}
          maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Tên sản phẩm *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Vợt cầu lông Yonex..." className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="SHOPVNB-VNB026679" className="input-field font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Giá (VNĐ) *</label>
                  <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="1500000" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Giá gốc / niêm yết</label>
                  <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="1800000" className="input-field" />
                  <p className="mt-1 text-xs text-text-muted">Nếu lớn hơn giá bán, web sẽ hiện giá gốc bị gạch.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Tồn kho *</label>
                  <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="100" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Màu sắc</label>
                  <input value={form.colorOptions} onChange={(e) => setForm({ ...form, colorOptions: e.target.value })}
                    placeholder="Đen tím, Xanh dương" className="input-field" />
                  <p className="mt-1 text-xs text-text-muted">Cách nhau bằng dấu phẩy.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Size</label>
                  <input value={form.sizeOptions} onChange={(e) => setForm({ ...form, sizeOptions: e.target.value })}
                    placeholder="4U5, 3U5" className="input-field" />
                  <p className="mt-1 text-xs text-text-muted">Cách nhau bằng dấu phẩy.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Thương hiệu</label>
                  <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field">
                    <option value="">-- Chọn thương hiệu --</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Danh mục</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Đối tượng</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="input-field">
                    <option value="">-- Chọn đối tượng --</option>
                    {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-surface-border px-4 py-3 bg-surface-soft">
                  <div>
                    <p className="text-sm font-semibold text-text-secondary">Hiển thị sản phẩm</p>
                    <p className="text-xs text-text-muted">Sản phẩm được bật sẽ xuất hiện trên cửa hàng và kết quả tìm kiếm.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.active ?? true}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-5 w-5 accent-brand-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Mô tả ngắn *</label>
                  <input required value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                    placeholder="Mô tả ngắn gọn về sản phẩm..." className="input-field" />
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
                        onChange={handleDescriptionImport}
                      />
                      <button
                        type="button"
                        onClick={() => descriptionFileRef.current?.click()}
                        className="btn-ghost px-3 py-1.5 text-xs border border-surface-border"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                        Nhập từ file
                      </button>
                    </div>
                  </div>
                  <textarea required rows={9} value={form.detailDesc} onChange={(e) => setForm({ ...form, detailDesc: e.target.value })}
                    placeholder={"Nhập mô tả theo từng đoạn.\n\nDùng dòng bắt đầu bằng # cho tiêu đề và - cho danh sách."}
                    className="input-field resize-y leading-7" />
                  <p className="mt-1.5 text-xs text-text-muted">
                    Hỗ trợ file TXT/Markdown tối đa 1MB. Nội dung được hiển thị theo đoạn và danh sách trên trang sản phẩm.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Ảnh sản phẩm</label>
                  <div className="rounded-xl border border-surface-border bg-surface-soft p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {form.images.length}/{MAX_PRODUCT_IMAGES} ảnh
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Ảnh đầu tiên là ảnh đại diện. Có thể chọn nhiều ảnh cùng lúc.
                        </p>
                      </div>
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || form.images.length >= MAX_PRODUCT_IMAGES}
                        className="btn-outline py-2 px-4 text-sm disabled:opacity-50">
                        {uploading
                          ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Đang tải ảnh...</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_photo_alternate</span> Chọn nhiều ảnh</>
                        }
                      </button>
                    </div>

                    {form.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {form.images.map((img, idx) => (
                          <div key={img} className={`relative rounded-lg border bg-white p-2 ${idx === 0 ? "border-brand-blue ring-2 ring-brand-blue/10" : "border-surface-border"}`}>
                            <div className="aspect-square rounded-md bg-surface-soft overflow-hidden">
                              <img src={getImageUrl(img)} alt={`Ảnh sản phẩm ${idx + 1}`} className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => setMainImage(img)}
                                disabled={idx === 0}
                                className={`text-[11px] font-semibold ${idx === 0 ? "text-brand-blue" : "text-text-muted hover:text-brand-blue"}`}
                              >
                                {idx === 0 ? "Ảnh đại diện" : "Đặt làm ảnh chính"}
                              </button>
                              <button type="button" onClick={() => removeImage(idx)} className="text-danger" aria-label={`Xóa ảnh ${idx + 1}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="mt-4 w-full min-h-32 rounded-lg border-2 border-dashed border-surface-border bg-white flex flex-col items-center justify-center text-text-muted hover:border-brand-blue hover:text-brand-blue transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 32 }}>collections</span>
                        <span className="text-sm font-semibold mt-2">Chọn ảnh sản phẩm</span>
                        <span className="text-xs mt-1">JPG, PNG hoặc WebP, tối đa 5MB mỗi ảnh</span>
                      </button>
                    )}
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
        </FormModal>
      )}

      {modal === "import" && (
        <FormModal
          title="Import Excel/CSV"
          onClose={closeModal}
          maxWidth="max-w-5xl"
        >
          <div className="p-6">
            <ProductImportPanel
              onImported={() => {
                fetchProducts();
                notifySync(syncEvent.PRODUCT_UPDATED);
              }}
            />
          </div>
        </FormModal>
      )}

      {modal === "delete" && selectedProduct && (
        <ConfirmDialog
          title="Xác nhận xóa sản phẩm?"
          description={`Bạn sắp xóa "${selectedProduct.name}". Hành động này không thể hoàn tác.`}
          icon="delete_forever"
          confirmLabel="Xóa sản phẩm"
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleDelete}
        />
      )}

      {modal === "delete_bulk" && selectedIds.length > 0 && (
        <ConfirmDialog
          title="Xác nhận xóa hàng loạt?"
          description={`Bạn sắp xóa ${selectedIds.length} sản phẩm đã chọn. Hành động này không thể hoàn tác.`}
          icon="delete_forever"
          confirmLabel="Xóa các sản phẩm"
          loading={saving}
          onCancel={closeModal}
          onConfirm={handleDeleteBulk}
        />
      )}
    </div>
  );
}
