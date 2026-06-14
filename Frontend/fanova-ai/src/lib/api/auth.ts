import { apiFetch, getAuthHeaders } from "./client";

export interface AuthResponse {
  userId: string;
  email: string;
  fullName?: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<ApiEnvelope<AuthResponse>>("/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function register(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthResponse> {
  const res = await apiFetch<ApiEnvelope<AuthResponse>>("/api/Auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName }),
  });
  return res.data;
}

export async function getMe(token: string): Promise<UserProfile> {
  const res = await apiFetch<ApiEnvelope<UserProfile>>("/api/Auth/me", {
    headers: { ...getAuthHeaders(token) },
  });
  return res.data;
}

export async function refreshAuthToken(refreshTk: string): Promise<AuthResponse> {
  const res = await apiFetch<ApiEnvelope<AuthResponse>>("/api/Auth/refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshTk }),
  });
  return res.data;
}
