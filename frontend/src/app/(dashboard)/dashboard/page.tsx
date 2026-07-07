"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp, ShoppingBag, Sparkles } from "lucide-react";
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
          total_sales: 0,
          order_count: 0,
          total_expenses: 0,
          profit: 0,
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
      label: "Total Revenue",
      value: formatCurrency(stats?.total_sales ?? 0),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Transactions",
      value: String(stats?.order_count ?? 0),
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Expenses",
      value: formatCurrency(stats?.total_expenses ?? 0),
      icon: ShoppingBag,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Profit",
      value: formatCurrency(stats?.profit ?? stats?.net_profit ?? 0),
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
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
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="card-stat group">
                  <div
                    className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 transition group-hover:opacity-20`}
                  />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {card.value}
                      </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {stats && stats.order_count > 0 && (
            <div className="card mt-6 flex items-center gap-4 border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Average Sale Value</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.total_sales / stats.order_count)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
