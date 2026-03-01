import { clearSession, getRefreshToken, getToken, setRefreshToken, setToken } from "./auth";

function getBackendUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }
  return backendUrl;
}

type RefreshResponse = {
  token: string;
  refreshToken: string;
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store"
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const data = (await response.json()) as RefreshResponse;
      if (!data?.token) {
        clearSession();
        return null;
      }

      setToken(data.token);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }

      return data.token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const authToken = token || (typeof window !== "undefined" ? getToken() : null);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const shouldRefresh =
    response.status === 401 &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/refresh" &&
    typeof window !== "undefined";

  if (shouldRefresh) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      response = await fetch(`${getBackendUrl()}${path}`, {
        ...options,
        headers,
        cache: "no-store"
      });
    }
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
