import type { User } from "@/types";

const TOKEN_KEY = "pos_token";
const USER_KEY = "pos_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(user?: User | null): boolean {
  const u = user ?? getUser();
  return u?.roles?.some((r) => r.name === "admin") ?? false;
}

export function isCashier(user?: User | null): boolean {
  const u = user ?? getUser();
  return u?.roles?.some((r) => r.name === "cashier") ?? false;
}

export function isSuperAdmin(user?: User | null): boolean {
  const u = user ?? getUser();
  return u?.roles?.some((r) => r.name === "super_admin") ?? false;
}

export function getUserRole(user?: User | null): "super_admin" | "admin" | "cashier" | null {
  const u = user ?? getUser();
  if (!u?.roles?.length) return null;
  if (u.roles.some((r) => r.name === "super_admin")) return "super_admin";
  if (u.roles.some((r) => r.name === "admin")) return "admin";
  if (u.roles.some((r) => r.name === "cashier")) return "cashier";
  return null;
}

export function getHomeRoute(user?: User | null): string {
  if (isSuperAdmin(user)) return "/platform/shops";
  return isAdmin(user) ? "/dashboard" : "/pos";
}
