"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser, getHomeRoute } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? getHomeRoute(getUser()) : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-900">
      <div className="text-center">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-200/80">Loading ShopPOS...</p>
      </div>
    </div>
  );
}
