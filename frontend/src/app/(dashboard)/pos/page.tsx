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
  ScanBarcode,
  Wallet,
  Check,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import PageLoader from "@/components/ui/PageLoader";
import ProductAvatar from "@/components/ui/ProductAvatar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Pagination } from "@/components/ui/TableControls";
import { cn, formatCurrency, getApiErrorMessage } from "@/lib/utils";
import type { Category, PaginatedData, Product, Sale, StoreSettings } from "@/types";

const EXPENSE_CATEGORIES = ["Supplies", "Utilities", "Rent", "Transport", "Other"];

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [productPage, setProductPage] = useState(1);
  const [productPages, setProductPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
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
    category: "",
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
        const [cats, storeSettings] = await Promise.all([
          apiGet<Category[]>("/categories"),
          apiGet<StoreSettings>("/settings").catch(() => null),
        ]);
        setCategories(cats.filter((c) => c.is_active));
        setSettings(storeSettings);
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params: Record<string, unknown> = {
          page: productPage,
          per_page: 20,
        };
        if (search) params.search = search;
        if (categoryId) params.category_id = categoryId;
        const data = await apiGet<PaginatedData<Product>>("/products", params);
        setProducts(data.items);
        setProductPages(data.meta.last_page);
        setProductTotal(data.meta.total);
      } catch {
        // keep current list
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId, productPage]);

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
        category: expenseForm.category || null,
        amount: parseFloat(expenseForm.amount),
        expense_date: new Date().toISOString().split("T")[0],
        note: expenseForm.note || null,
      });
      setExpenseForm({ title: "", category: "", amount: "", note: "" });
      setExpenseOpen(false);
      setSuccess("Expense recorded!");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExpenseSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Point of Sale
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {settings?.store_name ?? "Tap products to add to cart"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpenseOpen(true);
              setError("");
            }}
            className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            <Wallet className="h-4 w-4" />
            Quick Expense
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200/70 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-700">Ready to sell</span>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div
          className={cn(
            "mb-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold",
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="space-y-3 border-b border-slate-100 p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                className="input-field py-3 pl-10 pr-11 text-[15px]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setProductPage(1);
                }}
                autoFocus
              />
              <ScanBarcode className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setCategoryId("");
                  setProductPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition",
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
                  onClick={() => {
                    setCategoryId(c.id);
                    setProductPage(1);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition",
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
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addItem(product)}
                    disabled={product.stock <= 0}
                    className="pos-product-tile group"
                  >
                    <ProductAvatar
                      name={product.name}
                      imageUrl={product.image_url}
                      productId={product.id}
                      size="tile"
                    />
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      <p
                        className="line-clamp-2 min-h-[2.5rem] text-left text-sm font-bold leading-snug text-slate-800"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <p
                        className="mt-auto pt-2 text-left text-lg font-extrabold text-primary-600"
                        title={formatCurrency(product.price, currencySymbol)}
                      >
                        {formatCurrency(product.price, currencySymbol)}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-left text-xs font-semibold",
                          product.stock <= 0
                            ? "text-red-500"
                            : product.stock <= 5
                              ? "text-amber-600"
                              : "text-slate-400"
                        )}
                      >
                        {product.stock <= 0
                          ? "Out of stock"
                          : `In Stock: ${product.stock}`}
                      </p>
                    </div>
                  </button>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                  <Pagination
                    page={productPage}
                    totalPages={productPages}
                    total={productTotal}
                    perPage={20}
                    onPageChange={setProductPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="pos-cart-panel w-full shrink-0 lg:w-[23rem] xl:w-[26rem]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Order</h2>
              <p className="text-xs font-medium text-slate-500">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="rounded-xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Clear cart"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="min-h-[120px] flex-1 overflow-y-auto px-4 py-3">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <ShoppingBag className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Tap a product to start</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => {
                  const lineTotal = parseFloat(item.product.price) * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <ProductAvatar
                        name={item.product.name}
                        imageUrl={item.product.image_url}
                        productId={item.product.id}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800" title={item.product.name}>
                          {item.product.name}
                        </p>
                        <p
                          className="text-xs font-medium text-slate-500"
                          title={formatCurrency(item.product.price, currencySymbol)}
                        >
                          {formatCurrency(item.product.price, currencySymbol)}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-sm font-extrabold text-slate-900"
                              title={formatCurrency(lineTotal, currencySymbol)}
                            >
                              {formatCurrency(lineTotal, currencySymbol)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800" title={formatCurrency(subtotal, currencySymbol)}>
                  {formatCurrency(subtotal, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-600">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-28 bg-white py-2 text-right text-sm font-semibold"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Tax ({taxPercent}%)</span>
                <span className="font-semibold text-slate-800" title={formatCurrency(tax, currencySymbol)}>
                  {formatCurrency(tax, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 shadow-lg">
                <span className="text-sm font-semibold text-slate-300">Total Payable</span>
                <span
                  className="text-xl font-extrabold tracking-tight text-emerald-400"
                  title={formatCurrency(total, currencySymbol)}
                >
                  {formatCurrency(total, currencySymbol)}
                </span>
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
                className="input-field bg-white py-3 text-lg font-bold"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-emerald-800">Change</span>
              <span
                className="text-xl font-extrabold text-emerald-700"
                title={formatCurrency(change, currencySymbol)}
              >
                {formatCurrency(change, currencySymbol)}
              </span>
            </div>

            <input
              type="text"
              className="input-field bg-white text-sm"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={processing || items.length === 0}
              className="btn-primary w-full py-3.5 text-base shadow-lg shadow-emerald-500/25"
            >
              {processing ? (
                "Processing..."
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Complete Sale
                </>
              )}
            </button>
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
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <SearchableSelect
                    value={expenseForm.category}
                    onChange={(value) =>
                      setExpenseForm({ ...expenseForm, category: value })
                    }
                    options={EXPENSE_CATEGORIES.map((cat) => ({
                      value: cat,
                      label: cat,
                    }))}
                    placeholder="Select category..."
                  />
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
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: e.target.value })
                    }
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
