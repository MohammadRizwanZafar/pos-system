"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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

const ownerOnlyRoutes = ["/dashboard", "/reports", "/users", "/settings"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const cached = getUser();
    if (cached) setUserState(cached);

    apiGet<User>("/auth/me")
      .then((freshUser) => {
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
        clearAuth();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router, pathname]);

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
    <div className="app-shell flex min-h-screen">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className={cn("flex-1 overflow-auto", isPos ? "p-4 lg:p-5" : "p-6 lg:p-8")}>
        <div
          className={cn(
            "animate-fade-in",
            isPos ? "mx-auto h-full max-w-[1600px]" : "mx-auto max-w-7xl"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
