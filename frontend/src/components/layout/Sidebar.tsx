"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Receipt,
  RotateCcw,
  Wallet,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdmin, isCashier } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  adminOnly?: boolean;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400", adminOnly: true },
  { label: "POS", href: "/pos", icon: ShoppingCart, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", highlight: true },
  { label: "Products", href: "/products", icon: Package, iconBg: "bg-amber-500/15", iconColor: "text-amber-400" },
  { label: "Categories", href: "/categories", icon: Tags, iconBg: "bg-pink-500/15", iconColor: "text-pink-400" },
  { label: "Sales", href: "/sales", icon: Receipt, iconBg: "bg-sky-500/15", iconColor: "text-sky-400" },
  { label: "Returns", href: "/returns", icon: RotateCcw, iconBg: "bg-rose-500/15", iconColor: "text-rose-400" },
  { label: "Expenses", href: "/expenses", icon: Wallet, iconBg: "bg-orange-500/15", iconColor: "text-orange-400", adminOnly: true },
  { label: "Reports", href: "/reports", icon: BarChart3, iconBg: "bg-violet-500/15", iconColor: "text-violet-400", adminOnly: true },
  { label: "Users", href: "/users", icon: Users, iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400", adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings, iconBg: "bg-slate-500/20", iconColor: "text-slate-300", adminOnly: true },
];

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const admin = isAdmin(user);
  const cashier = isCashier(user);

  const visibleItems = navItems.filter((item) => {
    if (cashier) {
      return (
        item.href === "/pos" ||
        item.href === "/products" ||
        item.href === "/categories" ||
        item.href === "/sales" ||
        item.href === "/returns"
      );
    }
    return !item.adminOnly || admin;
  });

  return (
    <aside className="flex w-[17.5rem] shrink-0 flex-col bg-sidebar text-slate-300 shadow-xl">
      <div className="border-b border-sidebar-border px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-emerald-500/25">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">ShopPOS</p>
            <p className="truncate text-xs font-medium text-emerald-400/90">
              {user?.name ?? "User"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Menu
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-primary-600/90 to-primary-500/80 text-white shadow-md"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-white",
                item.highlight &&
                  !active &&
                  "ring-1 ring-primary-500/30 hover:ring-primary-400/50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105",
                  active ? "bg-white/20" : item.iconBg
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition",
                    active ? "text-white" : item.iconColor
                  )}
                />
              </span>
              {item.label}
              {item.highlight && !active && (
                <span className="ml-auto rounded-md bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  Sell
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-xl bg-sidebar-hover px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
