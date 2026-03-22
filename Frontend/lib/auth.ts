const defaultApiBaseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://navkar-service.onrender.com";

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  defaultApiBaseUrl;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
const AUTH_COOKIE_NAME = "auth_token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_STORAGE_KEY = "auth_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function setAuthToken(token: string): void {
  if (!isBrowser() || !token) return;

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax${secure}`;
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (!isBrowser()) return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthToken(): string {
  if (!isBrowser()) return "";

  const prefix = `${AUTH_COOKIE_NAME}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (match) {
    return decodeURIComponent(match.slice(prefix.length));
  }

  const fromStorage = window.localStorage.getItem(AUTH_STORAGE_KEY) || "";
  if (fromStorage) {
    // Keep middleware-compatible cookie in sync if only local storage has token.
    setAuthToken(fromStorage);
  }

  return fromStorage;
}

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || undefined);
  const token = getAuthToken();

  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    clearAuthToken();
  }

  return response;
}

export async function getApiMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch (error) {
    return fallback;
  }
}
