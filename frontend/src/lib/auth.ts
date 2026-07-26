import type { User } from "@/types";

const TOKEN_KEY = "pos_token";
const USER_KEY = "pos_user";
const TOKEN_AT_KEY = "pos_token_at";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Session-only storage — cleared when the browser is closed. */
function store(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

/** Remove any leftover persistent login from older builds (localStorage). */
function purgeLegacyLocalAuth(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TOKEN_AT_KEY);
  } catch {
    // ignore
  }
}

function isTokenExpired(): boolean {
  const s = store();
  if (!s) return true;
  const raw = s.getItem(TOKEN_AT_KEY);
  if (!raw) return true;
  const loginAt = Number(raw);
  if (!Number.isFinite(loginAt)) return true;
  return Date.now() - loginAt >= ONE_DAY_MS;
}

export function getToken(): string | null {
  purgeLegacyLocalAuth();
  const s = store();
  if (!s) return null;
  const token = s.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }
  return token;
}

export function setToken(token: string): void {
  purgeLegacyLocalAuth();
  const s = store();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  s.setItem(TOKEN_AT_KEY, String(Date.now()));
}

export function getUser(): User | null {
  purgeLegacyLocalAuth();
  const s = store();
  if (!s) return null;
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }
  const raw = s.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  purgeLegacyLocalAuth();
  const s = store();
  if (!s) return;
  s.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  purgeLegacyLocalAuth();
  const s = store();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
  s.removeItem(TOKEN_AT_KEY);
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
