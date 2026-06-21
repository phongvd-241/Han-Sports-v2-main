import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { settingApi } from "../../../api/settingApi";
import { productApi } from "../../../api/productApi";
import { useSettingStore } from "../../../store/useSettingStore";
import { notifySync, syncEvent } from "../../../utils/sync";
import {
  readSetting,
  normalizeNavList,
  normalizeStringList,
  normalizeSlides,
  normalizeCategories,
  DEFAULT_HEADER_NAV,
  stableStringify,
  toComparable,
  getTabComparable,
  validateSettings,
  toSitePayload,
  toTabUpdates,
  uniqueCatalogBrands,
  syncCatalogCategories,
} from "./settingsUtils";

export function useAdminSettings() {
  const { settings, refreshAdminSettings } = useSettingStore();
  const [activeTab, setActiveTab] = useState("banner");
  const [form, setForm] = useState(null);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState(null);

  const defaultForm = useMemo(() => {
    const headerNav = normalizeNavList(readSetting(settings, "HEADER_NAV", DEFAULT_HEADER_NAV));
    return {
      hotline: String(readSetting(settings, "HOTLINE", "090 123 4567")),
      shippingFee: String(readSetting(settings, "SHIPPING_FEE", "30000")),
      freeShipLimit: String(readSetting(settings, "FREE_SHIP_LIMIT", "500000")),
      brands: normalizeStringList(readSetting(settings, "BRANDS", ["Yonex", "Victor", "Lining"])),
      targets: normalizeStringList(readSetting(settings, "TARGETS", ["Nam", "Nữ", "Unisex"])),
      slides: normalizeSlides(readSetting(settings, "HERO_SLIDES", [])),
      categories: normalizeCategories(readSetting(settings, "CATEGORIES", [])),
      headerNav,
    };
  }, [settings]);

  const isDirty = form ? stableStringify(toComparable(form)) !== stableStringify(toComparable(defaultForm)) : false;
  const activeTabDirty = form ? stableStringify(getTabComparable(form, activeTab)) !== stableStringify(getTabComparable(defaultForm, activeTab)) : false;

  const isTabDirty = (tabKey) => {
    if (!form) return false;
    return stableStringify(getTabComparable(form, tabKey)) !== stableStringify(getTabComparable(defaultForm, tabKey));
  };

  useEffect(() => {
    if (settings) setForm(defaultForm);
  }, [defaultForm, settings]);

  useEffect(() => {
    refreshAdminSettings();
  }, [refreshAdminSettings]);

  useEffect(() => {
    let active = true;
    productApi.getNavigation()
      .then((response) => {
        const data = response.data?.data || response.data;
        if (active && Array.isArray(data?.categories)) {
          setCatalogGroups(data.categories);
        }
      })
      .catch((error) => console.error("Không thể tải catalog sản phẩm", error));

    return () => {
      active = false;
    };
  }, []);

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
    setUploadingBannerIndex(index);
    const toastId = toast.loading("Đang tải ảnh lên...");
    try {
      const res = await productApi.uploadFile(file, "banner");
      const uploaded = res.data?.data?.fileName || res.data?.fileName;
      const fileName = Array.isArray(uploaded) ? uploaded[0] : (uploaded || "");
      if (!fileName) {
        throw new Error("Upload response does not contain a file name");
      }
      updateListItem("slides", index, "image", fileName);
      updateListItem("slides", index, "imageFolder", "banner");
      toast.success("Tải ảnh lên thành công.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tải ảnh thất bại.", { id: toastId });
    } finally {
      setUploadingBannerIndex(null);
    }
  };

  const saveAll = async (event) => {
    if (event) event.preventDefault();
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
      toast.success("Đã lưu cấu hình tab.");
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

  const handleSyncCatalog = () => {
    if (catalogGroups.length === 0) {
      toast.error("Chưa có danh mục sản phẩm để đồng bộ.");
      return;
    }

    setForm((current) => ({
      ...current,
      brands: uniqueCatalogBrands(catalogGroups),
      categories: syncCatalogCategories(current.categories, catalogGroups),
    }));
    toast.success("Đã đưa danh mục và thương hiệu từ sản phẩm vào biểu mẫu. Nhấn Lưu để áp dụng.");
  };

  return {
    settings,
    activeTab,
    setActiveTab,
    form,
    setForm,
    catalogGroups,
    saving,
    uploadingBannerIndex,
    isDirty,
    activeTabDirty,
    isTabDirty,
    updateField,
    updateListItem,
    addListItem,
    removeListItem,
    moveListItem,
    handleBannerUpload,
    saveAll,
    saveCurrentTab,
    handleRevert,
    handleSyncCatalog,
  };
}
