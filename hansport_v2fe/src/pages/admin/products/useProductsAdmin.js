import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { productApi } from "../../../api/productApi";
import { useSettingStore } from "../../../store/useSettingStore";
import { notifySync, syncEvent } from "../../../utils/sync";
import { EMPTY_FORM, MAX_PRODUCT_IMAGES, optionText, parseOptions, getProductFirstImage } from "./productFormUtils";

export function useProductsAdmin() {
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
      const priceVal = Number(form.price);
      const skuVal = form.sku && form.sku.trim() ? form.sku.trim() : null;
      const originalPriceVal = form.originalPrice && Number(form.originalPrice) > 0 ? Number(form.originalPrice) : null;

      const payload = {
        ...form,
        sku: skuVal,
        price: priceVal,
        originalPrice: originalPriceVal,
        quantity: Number(form.quantity),
        colorOptions: parseOptions(form.colorOptions),
        sizeOptions: parseOptions(form.sizeOptions),
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

  const lowStockOnPage = products.filter((item) => (item.quantity || 0) > 0 && (item.quantity || 0) <= 5).length;
  const outOfStockOnPage = products.filter((item) => (item.quantity || 0) <= 0).length;
  const withImagesOnPage = products.filter((item) => Boolean(getProductFirstImage(item))).length;

  return {
    CATEGORIES,
    BRANDS,
    products,
    loading,
    totalPages,
    totalElements,
    page,
    setPage,
    search,
    setSearch,
    selectedIds,
    setSelectedIds,
    modal,
    setModal,
    form,
    setForm,
    saving,
    uploading,
    selectedProduct,
    fileRef,
    descriptionFileRef,
    openAdd,
    openEdit,
    openDelete,
    closeModal,
    handleReset,
    removeImage,
    setMainImage,
    handleUpload,
    handleDescriptionImport,
    handleSave,
    handleDelete,
    handleDeleteBulk,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    lowStockOnPage,
    outOfStockOnPage,
    withImagesOnPage,
    fetchProducts
  };
}
