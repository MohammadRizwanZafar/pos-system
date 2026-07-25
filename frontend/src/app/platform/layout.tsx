"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import { apiGet } from "@/lib/api";
import {
  clearAuth,
  getToken,
  getUser,
  isAuthenticated,
  isSuperAdmin,
  setUser,
} from "@/lib/auth";
import type { User } from "@/types";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const cached = getUser();
    if (cached?.roles?.length) {
      setUserState(cached);
      if (!isSuperAdmin(cached)) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    }

    apiGet<User>("/auth/me")
      .then((freshUser) => {
        setUser(freshUser);
        setUserState(freshUser);

        if (!isSuperAdmin(freshUser)) {
          router.replace("/dashboard");
          return;
        }

        setLoading(false);
      })
      .catch(() => {
        clearAuth();
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        const { default: api } = await import("@/lib/api");
        await api.post("/auth/logout");
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (loading || !user || !isSuperAdmin(user)) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <PageLoader label="Loading platform..." />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">ShopPOS Platform</p>
              <p className="text-xs text-slate-500">Manage all shops, owners & cashiers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6 lg:p-8">{children}</main>
    </div>
  );
}
