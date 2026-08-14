import type { User } from "../types";
import { request } from "./client";

export function register(body: { email: string; password: string; displayName: string }) {
  return request<{ user: User; token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: { email: string; password: string }) {
  return request<{ user: User; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function me() {
  return request<{ user: User }>("/api/auth/me");
}
