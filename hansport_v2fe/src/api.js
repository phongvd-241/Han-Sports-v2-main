export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function extractMessage(payload) {
  if (!payload) return "Có lỗi xảy ra";
  if (Array.isArray(payload.message)) return payload.message.join(", ");
  return payload.message || payload.error || "Có lỗi xảy ra";
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("hs_access_token");
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_ORIGIN}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok || (payload && payload.statusCode >= 400)) {
    throw new Error(extractMessage(payload));
  }

  return payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
}

export function productImageUrl(fileName) {
  return fileName ? `${API_ORIGIN}/storage/product/${fileName}` : "";
}
