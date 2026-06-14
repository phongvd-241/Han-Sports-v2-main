export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const LOGO_CIRCLE = `${API_BASE_URL}/api/v1/files?fileName=z7807481637936_0284e7519d48b7526c7093c9e370821b.jpg&folder=logo`;
export const LOGO_TEXT = `${API_BASE_URL}/api/v1/files?fileName=z7807481884127_d5f1ae90f114ea8f06f081653cf869fc.jpg&folder=logo`;

export function getImageUrl(fileName, folder = "product", version = null) {
  if (!fileName) return null;
  if (fileName.startsWith("http")) return fileName;
  const params = new URLSearchParams({
    fileName,
    folder,
  });
  if (version) params.set("v", String(version));
  return `${API_BASE_URL}/api/v1/files?${params.toString()}`;
}

export function getFirstImage(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    return typeof first === "string" ? first : (first.imageUrl || first.image || null);
  }
  if (item.image) return item.image;
  return null;
}

export function formatVND(amount) {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const ORDER_STATUS = {
  PENDING: { label: "Chờ xác nhận", color: "badge-blue" },
  CONFIRMED: { label: "Đã xác nhận", color: "badge-blue" },
  PROCESSING: { label: "Đang xử lý", color: "badge-blue" },
  SHIPPING: { label: "Đang giao", color: "badge-green" },
  COMPLETED: { label: "Hoàn thành", color: "badge-green" },
  CANCELLED: { label: "Đã hủy", color: "badge-danger" },
};
