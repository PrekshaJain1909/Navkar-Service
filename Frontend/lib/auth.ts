const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || undefined);

  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(getApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function getApiMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch (error) {
    return fallback;
  }
}
