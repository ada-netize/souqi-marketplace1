import { Platform } from "react-native";
import Constants from "expo-constants";

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function guessBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return normalizeBaseUrl(explicit);

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || "";
  const host = hostUri ? String(hostUri).split(":")[0] : "";

  if (host) return `http://${host}:5000`;
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  return "http://localhost:5000";
}

export const API_URL = guessBaseUrl();

export async function request(path, options = {}, token = "") {
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "حدث خطأ");
    return data;
  } catch (error) {
    if (String(error?.message || "").includes("Network request failed")) {
      throw new Error(`تعذر الوصول إلى السيرفر. شغّل backend-api أو اضبط EXPO_PUBLIC_API_URL. العنوان الحالي: ${API_URL}`);
    }
    throw error;
  }
}
