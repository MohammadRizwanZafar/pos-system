"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Store,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import api from "@/lib/api";
import { setToken, setUser, getHomeRoute } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/utils";
import type { ApiResponse, LoginResponse } from "@/types";

const features = [
  { icon: ShoppingCart, text: "Fast checkout & billing" },
  { icon: BarChart3, text: "Sales & profit reports" },
  { icon: Zap, text: "Works on any device" },
  { icon: Shield, text: "Secure role-based access" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
        email,
        password,
      });

      setToken(data.data.token);
      setUser(data.data.user);
      router.push(getHomeRoute(data.data.user));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ShopPOS</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Run your shop
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                smarter & faster
              </span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-slate-400">
              Complete point of sale solution for vendors — billing, inventory,
              reports, all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-500">
          Trusted by shops & vendors
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">ShopPOS</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="admin@pos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-1 text-center text-xs text-slate-400">
            <p>Platform Admin: superadmin@pos.com / password</p>
            <p>Shop Owner: admin@pos.com / password</p>
            <p>Cashier: cashier@pos.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
