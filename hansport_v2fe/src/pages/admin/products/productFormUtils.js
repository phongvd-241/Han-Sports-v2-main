export const EMPTY_FORM = {
  sku: "", name: "", price: "", originalPrice: "", quantity: "", brand: "", target: "", category: "",
  shortDesc: "", detailDesc: "", active: true, images: [],
  colorOptions: "", sizeOptions: "",
};

export const MAX_PRODUCT_IMAGES = 8;

export const TARGETS = ["Nam", "Nữ", "Unisex", "Trẻ em"];

export const getProductFirstImage = (p) => {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    return typeof first === "string" ? first : (first.imageUrl || first.image || "");
  }
  return p.image || "";
};

export const optionText = (value) => Array.isArray(value) ? value.join(", ") : (value || "");

export const parseOptions = (value) => String(value || "")
  .split(/[;,|\n\r]+/)
  .map((item) => item.trim())
  .filter(Boolean);
