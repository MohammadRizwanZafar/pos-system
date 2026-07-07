"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Minus,
  Plus,
  Search,
  Trash2,
  X,
  ShoppingBag,
  Banknote,
  Receipt,
  Wallet,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import PageLoader from "@/components/ui/PageLoader";
import { cn, formatCurrency, getApiErrorMessage, getProductTileColor } from "@/lib/utils";
import type { Category, Product, Sale, StoreSettings } from "@/types";

const EXPENSE_CATEGORIES = ["Supplies", "Utilities", "Rent", "Transport", "Other"];

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [cashAmount, setCashAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Supplies",
    amount: "",
    note: "",
  });

  const {
    items,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    clearCart,
    getSubtotal,
  } = useCartStore();

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats, storeSettings] = await Promise.all([
          apiGet<Product[]>("/products"),
          apiGet<Category[]>("/categories"),
          apiGet<StoreSettings>("/settings").catch(() => null),
        ]);
        setProducts(prods);
        setCategories(cats);
        setSettings(storeSettings);
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const params: Record<string, unknown> = {};
        if (search) params.search = search;
        if (categoryId) params.category_id = categoryId;
        const prods = await apiGet<Product[]>("/products", params);
        setProducts(prods);
      } catch {
        // keep current list
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId]);

  const taxPercent = settings ? parseFloat(settings.tax_percent) : 0;
  const currencySymbol = settings?.currency_symbol ?? "Rs.";
  const subtotal = getSubtotal();
  const tax = (subtotal - discount) * (taxPercent / 100);
  const total = Math.max(0, subtotal - discount + tax);
  const paid = parseFloat(cashAmount) || 0;
  const change = Math.max(0, paid - total);

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      setError("Cart is empty");
      return;
    }
    if (paid < total) {
      setError("Insufficient cash amount");
      return;
    }

    setError("");
    setSuccess("");
    setProcessing(true);

    try {
      const sale = await apiPost<Sale>("/sales", {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        discount,
        amount_paid: paid,
        note: note || undefined,
      });

      clearCart();
      setCashAmount("");
      setNote("");
      setSuccess(`Sale completed! Invoice: ${sale.invoice_no}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickExpense = async (e: FormEvent) => {
    e.preventDefault();
    setExpenseSaving(true);
    setError("");

    try {
      await apiPost("/expenses", {
        title: expenseForm.title,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        expense_date: new Date().toISOString().split("T")[0],
        note: expenseForm.note || null,
      });
      setExpenseForm({ title: "", category: "Supplies", amount: "", note: "" });
      setExpenseOpen(false);
      setSuccess("Expense recorded!");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExpenseSaving(false);
    }
  };

  return (
    <div className="-mx-2 flex h-[calc(100vh-4rem)] flex-col lg:-mx-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Point of Sale
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {settings?.store_name ?? "Tap products to add to cart"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpenseOpen(true);
              setError("");
            }}
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            <Wallet className="h-4 w-4" />
            Quick Expense
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
          <Receipt className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-slate-600">
            {items.length} item{items.length !== 1 ? "s" : ""} in cart
          </span>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold",
            error
              ? "border border-red-200 bg-red-50 text-red-600"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          <span>{error || success}</span>
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-black/5"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Products */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or barcode..."
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  categoryId === ""
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                    categoryId === c.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <PageLoader label="Loading products..." />
            ) : products.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-3 h-12 w-12 text-slate-300" />
                <p className="font-semibold text-slate-500">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addItem(product)}
                    disabled={product.stock <= 0}
                    className={cn(
                      "pos-product-tile bg-gradient-to-br",
                      getProductTileColor(product.id)
                    )}
                  >
                    <p className="line-clamp-2 text-sm font-bold text-slate-800">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {product.category.name}
                      </p>
                    )}
                    <p className="mt-auto pt-3 text-lg font-extrabold text-primary-700">
                      {formatCurrency(product.price, currencySymbol)}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs font-semibold",
                        product.stock <= 5 ? "text-amber-600" : "text-slate-400"
                      )}
                    >
                      {product.stock <= 0 ? "Out of stock" : `${product.stock} in stock`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="pos-cart-panel w-full shrink-0 lg:w-[22rem] xl:w-96">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
            <h2 className="font-bold text-slate-900">Current Order</h2>
            <p className="text-xs font-medium text-slate-500">
              {items.length} item(s) · {formatCurrency(subtotal, currencySymbol)}
            </p>
          </div>

          <div className="min-h-[140px] flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <ShoppingBag className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Tap a product to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {item.product.name}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {formatCurrency(item.product.price, currencySymbol)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-600">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-28 bg-white text-right text-sm"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Tax ({taxPercent}%)</span>
                <span>{formatCurrency(tax, currencySymbol)}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-900 px-4 py-3 text-base font-bold text-white">
                <span>Total</span>
                <span>{formatCurrency(total, currencySymbol)}</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Banknote className="h-3.5 w-3.5" />
                Cash Received
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field bg-white text-lg font-bold"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
            </div>

            {paid > 0 && (
              <div className="flex justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                <span>Change</span>
                <span className="text-lg">{formatCurrency(change, currencySymbol)}</span>
              </div>
            )}

            <input
              type="text"
              className="input-field bg-white text-sm"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                disabled={items.length === 0}
                className="btn-secondary flex-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={processing || items.length === 0}
                className="btn-primary flex-[1.4] py-3 text-base"
              >
                {processing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expenseOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Expense</h2>
              <button type="button" onClick={() => setExpenseOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleQuickExpense} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title *</label>
                <input
                  required
                  className="input-field"
                  placeholder="e.g. Tea supplies"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Category *</label>
                  <select
                    required
                    className="input-field"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Amount *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Note</label>
                <input
                  className="input-field"
                  placeholder="Optional"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={expenseSaving} className="btn-primary">
                  {expenseSaving ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
