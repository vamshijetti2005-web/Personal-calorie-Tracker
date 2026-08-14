import type { ApiError } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export function getToken(): string | null {
  return localStorage.getItem("nourish_token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("nourish_token", token);
  else localStorage.removeItem("nourish_token");
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    const err = payload as ApiError | null;
    if (response.status === 401 && !path.startsWith("/api/auth/login")) {
      setToken(null);
    }
    throw new RequestError(
      err?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      err?.error?.code,
      err?.error?.details,
    );
  }
  return payload as T;
}

export function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}
