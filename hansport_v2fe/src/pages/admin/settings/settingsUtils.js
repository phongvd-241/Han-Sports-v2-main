import toast from "react-hot-toast";

export const TABS = [
  { key: "banner", label: "Banner", icon: "image" },
  { key: "navigation", label: "Menu", icon: "menu" },
  { key: "catalog", label: "Danh mục", icon: "category" },
  { key: "shipping", label: "Vận chuyển", icon: "local_shipping" },
  { key: "contact", label: "Liên hệ", icon: "call" },
];

export const SYSTEM_NAV_ITEMS = [
  { label: "Trang chủ", icon: "home", description: "Liên kết cố định về trang chủ" },
  { label: "Sản phẩm", icon: "category", description: "Mega dropdown lấy danh mục và thương hiệu từ sản phẩm" },
  { label: "Khuyến mãi", icon: "local_fire_department", description: "Liên kết cố định đến khu vực ưu đãi" },
];

export const ROUTE_OPTIONS = [
  { label: "Trang chủ", value: "/" },
  { label: "Cửa hàng", value: "/shop" },
  { label: "Giỏ hàng", value: "/cart" },
  { label: "Tài khoản", value: "/profile" },
  { label: "Đơn hàng của tôi", value: "/orders" },
  { label: "Khuyến mãi", value: "/shop?sale=true" },
];

export const ICON_OPTIONS = [
  "sports_tennis",
  "footprint",
  "dry_cleaning",
  "backpack",
  "local_fire_department",
  "fitness_center",
  "sports_handball",
  "category",
];

export const COLOR_OPTIONS = [
  { label: "Xanh dương", value: "bg-brand-blue-light text-brand-blue", preview: "bg-brand-blue" },
  { label: "Xanh lá", value: "bg-brand-green-light text-brand-green", preview: "bg-brand-green" },
  { label: "Xanh teal", value: "bg-brand-teal-light text-brand-teal", preview: "bg-brand-teal" },
  { label: "Đỏ", value: "bg-red-50 text-danger", preview: "bg-danger" },
  { label: "Vàng", value: "bg-amber-50 text-amber-600", preview: "bg-amber-500" },
  { label: "Xám", value: "bg-surface-muted text-text-primary", preview: "bg-text-muted" },
];

export const DEFAULT_HEADER_NAV = [
  { label: "Trang chủ", path: "/", active: true },
  { label: "Cửa hàng", path: "/shop", active: true },
  { label: "Khuyến mãi", path: "/shop?sale=true", active: true },
];

export function normalizeSlides(slides) {
  return Array.isArray(slides) ? slides.map((slide) => ({
    title: "",
    subtitle: "",
    cta: "",
    ctaLink: slide.ctaLink || "",
    image: slide.image || "",
    imageFolder: slide.imageFolder || "banner",
    altText: "",
    bg: "",
    active: slide.active !== false,
  })) : [];
}

export function normalizeCategories(categories) {
  return Array.isArray(categories) ? categories.map((category) => ({
    name: category.name || "",
    icon: category.icon || "category",
    path: category.path || "/shop",
    color: category.color || COLOR_OPTIONS[0].value,
    active: category.active !== false,
  })) : [];
}

/** Infer UI display type from stored path — does not affect payload */
export function inferNavType(path) {
  if (!path) return "custom";
  if (path.includes("category=")) return "category";
  if (path.includes("brand=")) return "brand";
  return "custom";
}

/** Normalize for display (includes _type for UI, stripped on save) */
export function normalizeNavList(items) {
  return Array.isArray(items) ? items.map((item) => ({
    label: item.label || "",
    path: item.path || "/shop",
    active: item.active !== false,
    _type: item._type || inferNavType(item.path || "/shop"),
  })) : [];
}

/** Strip UI-only fields before sending to backend */
export function serializeNavList(items) {
  return Array.isArray(items) ? items.map(({ label, path, active }) => ({ label, path, active })) : [];
}

export function normalizeStringList(values) {
  if (Array.isArray(values)) {
    return values.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof values === "string") {
    return values.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function readSetting(settings, key, defaultValue) {
  if (!settings || settings[key] === undefined) return defaultValue;

  const value = settings[key];
  if (typeof value !== "string") return value;

  const normalized = value.trim();
  if (!normalized.startsWith("[") && !normalized.startsWith("{")) return value;

  try {
    return JSON.parse(normalized);
  } catch {
    return value;
  }
}

export function uniqueCatalogBrands(catalogGroups) {
  return catalogGroups
    .flatMap((group) => group.brands || [])
    .map((brand) => brand.name?.trim())
    .filter((name, index, values) => name && values.indexOf(name) === index);
}

export function syncCatalogCategories(currentCategories, catalogGroups) {
  return catalogGroups.map((group, index) => {
    const current = currentCategories.find(
      (category) => category.name?.trim().toLowerCase() === group.name.trim().toLowerCase(),
    );
    return {
      name: group.name,
      icon: current?.icon || catalogCategoryIcon(group.name),
      path: `/shop?${new URLSearchParams({ category: group.name }).toString()}`,
      color: current?.color || catalogCategoryColor(index),
      active: current?.active !== false,
    };
  });
}

export function catalogCategoryIcon(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("vợt")) return "sports_tennis";
  if (normalized.includes("balo")) return "backpack";
  if (normalized.includes("túi")) return "shopping_bag";
  if (normalized.includes("giày")) return "footprint";
  if (normalized.includes("áo") || normalized.includes("quần")) return "dry_cleaning";
  return "category";
}

export function catalogCategoryColor(index) {
  return COLOR_OPTIONS[index % 3].value;
}

export function isInternalPath(path) {
  return typeof path === "string" && path.startsWith("/");
}

export function stableStringify(value) {
  return JSON.stringify(value);
}

export function formatVnd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0đ";
  return `${number.toLocaleString("vi-VN")}đ`;
}

export function toSitePayload(form) {
  return {
    hotline: form.hotline.trim(),
    shippingFee: Number(form.shippingFee),
    freeShipLimit: Number(form.freeShipLimit),
    brands: normalizeStringList(form.brands),
    targets: normalizeStringList(form.targets),
    heroSlides: normalizeSlides(form.slides),
    categories: normalizeCategories(form.categories),
    headerNav: serializeNavList(form.headerNav),
  };
}

export function toComparable(form) {
  return toSitePayload(form);
}

export function getTabComparable(form, tab) {
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

export function toTabUpdates(form, tab) {
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

export function validateSettings(form, activeTab, setActiveTab) {
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

  // Tương tự logic cũ, check if slide has an image. Đợi chút, logic gốc check `!getFirstImage(item)`
  // Để tương thích hoàn toàn, ta nên check `!item.image`
  const invalidSlide = form.slides.some((item) => !item.image || (item.ctaLink && !isInternalPath(item.ctaLink)));
  if (invalidSlide) {
    toast.error("Mỗi banner phải có ảnh và đường dẫn nội bộ phải bắt đầu bằng dấu /.");
    setActiveTab("banner");
    return false;
  }

  if (activeTab === "catalog" && (form.brands.length === 0 || form.targets.length === 0)) {
    toast.error("Catalog cần ít nhất một thương hiệu và một nhóm đối tượng.");
    return false;
  }

  return true;
}
