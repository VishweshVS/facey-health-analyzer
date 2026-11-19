const FALLBACK_API_URL = "https://facey-health-analyzer.onrender.com";

export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).trim();
  const normalized = raw.replace(/^(https?):\/+([^/])/i, "$1://$2");
  return normalized.replace(/\/+$/, "");
}

export async function apiFetch(path, options = {}) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${cleanPath}`, options);
}