"use client";

import { useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Receipt,
  RotateCcw,
  Wallet,
  Banknote,
  PackageCheck,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Store,
  X,
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
  { label: "Sold Products", href: "/sold-products", icon: PackageCheck, iconBg: "bg-fuchsia-500/15", iconColor: "text-fuchsia-400", adminOnly: true },
  { label: "Returns", href: "/returns", icon: RotateCcw, iconBg: "bg-rose-500/15", iconColor: "text-rose-400" },
  { label: "Opening Cash", href: "/opening-cash", icon: Banknote, iconBg: "bg-lime-500/15", iconColor: "text-lime-400", adminOnly: true },
  { label: "Expenses", href: "/expenses", icon: Wallet, iconBg: "bg-orange-500/15", iconColor: "text-orange-400", adminOnly: true },
  { label: "Reports", href: "/reports", icon: BarChart3, iconBg: "bg-violet-500/15", iconColor: "text-violet-400", adminOnly: true },
  { label: "Users", href: "/users", icon: Users, iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400", adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings, iconBg: "bg-slate-500/20", iconColor: "text-slate-300", adminOnly: true },
];

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  open?: boolean;
  onClose?: () => void;
}

function SidebarBody({
  user,
  onLogout,
  onClose,
  compact,
}: {
  user: User | null;
  onLogout: () => void;
  onClose?: () => void;
  compact?: boolean;
}) {
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
    <>
      <div
        className={cn(
          "flex items-center justify-between border-b border-sidebar-border",
          compact ? "px-2 py-4" : "px-4 py-4 sm:px-5"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-emerald-500/25">
            <Store className="h-5 w-5" />
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="text-base font-bold tracking-tight text-white">ShopPOS</p>
              <p className="truncate text-xs font-medium text-emerald-400/90">
                {user?.name ?? "User"}
              </p>
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-sidebar-hover hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto py-4",
          compact ? "px-1.5" : "px-2 sm:px-3"
        )}
      >
        {!compact && (
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Menu
          </p>
        )}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group flex items-center rounded-xl py-2 text-sm font-semibold transition",
                compact ? "justify-center px-2" : "gap-3 px-2.5 sm:px-3",
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
              {!compact && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.highlight && !active && (
                    <span className="ml-auto rounded-md bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      Sell
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border", compact ? "p-2" : "p-3 sm:p-4")}>
        <div className={cn("mb-3 rounded-xl bg-sidebar-hover", compact ? "p-2" : "px-3 py-3")}>
          <div className={cn("flex items-center gap-3", compact && "justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          className={cn(
            "flex w-full items-center rounded-xl py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400",
            compact ? "justify-center px-2" : "gap-3 px-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!compact && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ user, onLogout, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Compact icon rail for medium laptops */}
      <aside className="hidden w-[4.75rem] shrink-0 flex-col bg-sidebar text-slate-300 shadow-xl lg:flex xl:hidden">
        <SidebarBody user={user} onLogout={onLogout} compact />
      </aside>

      {/* Full sidebar for large screens */}
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-slate-300 shadow-xl xl:flex 2xl:w-[17rem]">
        <SidebarBody user={user} onLogout={onLogout} />
      </aside>

      {/* Drawer for phones / small laptops */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-slate-900/50 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-sidebar text-slate-300 shadow-2xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarBody user={user} onLogout={onLogout} onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
