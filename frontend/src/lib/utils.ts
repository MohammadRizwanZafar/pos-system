export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const productTileColors = [
  "from-emerald-500/10 to-teal-500/5 border-emerald-200/60",
  "from-blue-500/10 to-cyan-500/5 border-blue-200/60",
  "from-violet-500/10 to-purple-500/5 border-violet-200/60",
  "from-amber-500/10 to-orange-500/5 border-amber-200/60",
  "from-rose-500/10 to-pink-500/5 border-rose-200/60",
  "from-sky-500/10 to-indigo-500/5 border-sky-200/60",
];

export function getProductTileColor(id: number): string {
  return productTileColors[id % productTileColors.length];
}

export function formatCurrency(amount: number | string, symbol = "Rs."): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${symbol} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getProductSellPrice(product: {
  price: string | number;
  discount_percent?: string | number | null;
  sell_price?: string | number | null;
}): number {
  if (product.sell_price != null && product.sell_price !== "") {
    return typeof product.sell_price === "string"
      ? parseFloat(product.sell_price)
      : product.sell_price;
  }

  const price =
    typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const discount = Math.min(
    100,
    Math.max(
      0,
      product.discount_percent == null || product.discount_percent === ""
        ? 0
        : typeof product.discount_percent === "string"
          ? parseFloat(product.discount_percent)
          : product.discount_percent
    )
  );

  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDateRange(
  period: "today" | "week" | "month" | "custom",
  customFrom?: string,
  customTo?: string
): { from_date: string; to_date: string } {
  const today = new Date();
  const to_date = today.toISOString().split("T")[0];

  if (period === "custom" && customFrom && customTo) {
    return { from_date: customFrom, to_date: customTo };
  }

  if (period === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return { from_date: weekAgo.toISOString().split("T")[0], to_date };
  }

  if (period === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from_date: monthStart.toISOString().split("T")[0], to_date };
  }

  return { from_date: to_date, to_date };
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    const data = axiosError.response?.data;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.[0]) return first[0];
    }
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
