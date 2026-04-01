import { API_URL } from "./api";

export function imageUri(path) {
  if (!path) return `${API_URL}/uploads/listing-placeholder.jpg`;
  if (String(path).startsWith("http")) return path;
  return `${API_URL}${path}`;
}

export function money(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString()} ₪`;
}

export function listingStatusLabel(status) {
  if (status === "sold") return "تم البيع";
  if (status === "reserved") return "محجوز";
  return "متوفر";
}

export function isCars(categoryId) {
  return String(categoryId) === "1";
}

export function isRealEstate(categoryId) {
  return String(categoryId) === "2";
}

export function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value = "") {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function digitsOnly(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

export function normalizePhone(value = "") {
  return digitsOnly(value);
}

export function isValidPhone(value = "") {
  return /^\d{9,15}$/.test(normalizePhone(value));
}
