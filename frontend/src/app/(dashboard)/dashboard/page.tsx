"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp, ShoppingBag, Wallet, Banknote, HandCoins } from "lucide-react";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
import PeriodFilter, { type Period } from "@/components/ui/PeriodFilter";
import { apiGet } from "@/lib/api";
import { formatCurrency, getDateRange } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { from_date, to_date } = getDateRange(period, customFrom, customTo);
        const data = await apiGet<DashboardStats>("/dashboard/stats", {
          period,
          from_date,
          to_date,
        });
        setStats(data);
      } catch {
        setStats({
          period,
          from_date: "",
          to_date: "",
          opening_cash: 0,
          total_sales: 0,
          order_count: 0,
          total_expenses: 0,
          cash_in_hand: 0,
          profit: 0,
          net_profit: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (period !== "custom" || (customFrom && customTo)) {
      fetchStats();
    }
  }, [period, customFrom, customTo]);

  const cards = [
    {
      label: "Opening Cash",
      value: formatCurrency(stats?.opening_cash ?? 0),
      icon: Banknote,
      gradient: "from-lime-500 to-green-600",
      glow: "shadow-lime-500/30",
      accent: "text-lime-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.total_sales ?? 0),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/30",
      accent: "text-emerald-600",
    },
    {
      label: "No of Sales",
      value: String(stats?.order_count ?? 0),
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/30",
      accent: "text-blue-600",
    },
    {
      label: "Expenses",
      value: formatCurrency(stats?.total_expenses ?? 0),
      icon: ShoppingBag,
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/30",
      accent: "text-violet-600",
    },
    {
      label: "Cash in Hand",
      value: formatCurrency(stats?.cash_in_hand ?? 0),
      icon: HandCoins,
      gradient: "from-sky-500 to-cyan-600",
      glow: "shadow-sky-500/30",
      accent: "text-sky-600",
    },
    {
      label: "Total Profit",
      value: formatCurrency(Number(stats?.profit ?? 0)),
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/30",
      accent: "text-amber-600",
    },
    {
      label: "Net Profit",
      value: formatCurrency(Number(stats?.net_profit ?? 0)),
      icon: Wallet,
      gradient: "from-teal-500 to-cyan-600",
      glow: "shadow-teal-500/30",
      accent: "text-teal-600",
    },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your store performance" />

      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card-stat group">
                <div
                  className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-sm transition duration-300 group-hover:scale-125 group-hover:opacity-20`}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                    <p
                      title={card.value}
                      className="mt-2 break-words text-[clamp(1.05rem,1.4vw,1.5rem)] font-extrabold leading-tight tracking-tight text-slate-900"
                    >
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.glow}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${card.gradient} opacity-80`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
