"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import PageLoader from "@/components/ui/PageLoader";
import { apiGet } from "@/lib/api";
import {
  clearAuth,
  getToken,
  getUser,
  setUser,
  isAdmin,
  isAuthenticated,
  isSuperAdmin,
  getHomeRoute,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const ownerOnlyRoutes = ["/dashboard", "/reports", "/users", "/settings", "/sold-products"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const cached = getUser();
    if (cached) {
      setUserState(cached);
      setLoading(false);

      if (isSuperAdmin(cached)) {
        router.replace("/platform/shops");
        return;
      }

      if (ownerOnlyRoutes.some((r) => pathname.startsWith(r)) && !isAdmin(cached)) {
        router.replace(getHomeRoute(cached));
      }
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      // Don't keep a blank screen forever if API is slow
      if (!cancelled) setLoading(false);
    }, 4000);

    apiGet<User>("/auth/me")
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
        setUserState(freshUser);

        if (isSuperAdmin(freshUser)) {
          router.replace("/platform/shops");
          return;
        }

        if (ownerOnlyRoutes.some((r) => pathname.startsWith(r)) && !isAdmin(freshUser)) {
          router.replace(getHomeRoute(freshUser));
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (!getUser()) {
          clearAuth();
          router.replace("/login");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        window.clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
    // Auth refresh should not re-run on every route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!user) return;
    if (isSuperAdmin(user)) {
      router.replace("/platform/shops");
      return;
    }
    if (ownerOnlyRoutes.some((r) => pathname.startsWith(r)) && !isAdmin(user)) {
      router.replace(getHomeRoute(user));
    }
  }, [pathname, user, router]);

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        const { default: api } = await import("@/lib/api");
        await api.post("/auth/logout");
      }
    } catch {
      // ignore logout errors
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <PageLoader label="Opening your store..." />
      </div>
    );
  }

  const isPos = pathname === "/pos" || pathname.startsWith("/pos/");

  return (
    <div className="app-shell flex min-h-dvh min-h-screen">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">ShopPOS</p>
            <p className="truncate text-xs text-slate-500">{user?.name}</p>
          </div>
        </div>

        <main
          className={cn(
            "min-w-0 flex-1",
            isPos ? "overflow-hidden p-2 sm:p-3 lg:p-4" : "overflow-auto p-3 sm:p-5 lg:p-6 xl:p-8"
          )}
        >
          <div
            className={cn(
              "animate-fade-in",
              isPos
                ? "mx-auto flex h-[calc(100dvh-3.5rem)] flex-col lg:h-[calc(100dvh-2rem)] lg:max-h-none"
                : "mx-auto max-w-7xl"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
