const dayjs = require("dayjs");

function now() {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
}

function addDays(date = now(), days = 0) {
  return dayjs(date).add(Number(days || 0), "day").format("YYYY-MM-DD HH:mm:ss");
}

function isFuture(value) {
  return !!value && dayjs(value).isAfter(dayjs());
}

function tryParseJSON(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value = "") {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function digitsOnly(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

function normalizePhone(value = "") {
  return digitsOnly(value);
}

function isValidPhone(value = "") {
  const phone = normalizePhone(value);
  return /^\d{9,15}$/.test(phone);
}

module.exports = {
  now,
  addDays,
  isFuture,
  tryParseJSON,
  asNumber,
  normalizeEmail,
  isValidEmail,
  digitsOnly,
  normalizePhone,
  isValidPhone,
};
