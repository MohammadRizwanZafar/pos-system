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
  Printer,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import PageLoader from "@/components/ui/PageLoader";
import ProductAvatar from "@/components/ui/ProductAvatar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Pagination } from "@/components/ui/TableControls";
import { printSaleReceipt } from "@/lib/printReceipt";
import { cn, formatCurrency, getApiErrorMessage, getProductSellPrice, localDateString } from "@/lib/utils";
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
  const [taxPercent, setTaxPercent] = useState(0);
  const [printReceipt, setPrintReceipt] = useState(true);
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
          apiGet<Category[] | PaginatedData<Category>>("/categories", { active_only: 1 }),
          apiGet<StoreSettings>("/settings").catch(() => null),
        ]);
        setCategories(Array.isArray(cats) ? cats : cats?.items ?? []);
        setSettings(storeSettings);
        if (storeSettings) {
          setTaxPercent(parseFloat(storeSettings.tax_percent) || 0);
        }
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Search debounce only — first paint / page change loads immediately
    const delay = search.trim() ? 250 : 0;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params: Record<string, unknown> = {
          page: productPage,
          per_page: 20,
          active_only: 1,
        };
        const q = search.trim();
        if (q) params.search = q;
        if (categoryId) params.category_id = categoryId;
        const data = await apiGet<PaginatedData<Product>>("/products", params);
        if (cancelled) return;
        setProducts(data?.items ?? []);
        setProductPages(data?.meta?.last_page ?? 1);
        setProductTotal(data?.meta?.total ?? 0);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, categoryId, productPage]);

  const currencySymbol = settings?.currency_symbol ?? "Rs.";
  const defaultTaxPercent = settings ? parseFloat(settings.tax_percent) || 0 : 0;
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

    const shouldPrint = printReceipt;

    try {
      const sale = await apiPost<Sale>("/sales", {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        discount,
        tax_percent: taxPercent,
        amount_paid: paid,
        note: note || undefined,
      });

      clearCart();
      setCashAmount("");
      setNote("");
      setTaxPercent(defaultTaxPercent);
      setSuccess(
        shouldPrint
          ? `Sale completed! Printing receipt: ${sale.invoice_no}`
          : `Sale completed! Invoice: ${sale.invoice_no}`
      );
      setProcessing(false);

      if (shouldPrint) {
        // Print after UI unlocks so the button is not stuck on "Processing..."
        window.setTimeout(async () => {
          try {
            const invoice = await apiGet<{ sale: Sale; store: StoreSettings | null }>(
              `/sales/${sale.id}/invoice`
            );
            printSaleReceipt(invoice.sale, invoice.store ?? settings);
          } catch {
            printSaleReceipt(sale, settings);
          }
        }, 50);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
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
        expense_date: localDateString(),
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3 sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl xl:text-2xl">
            Point of Sale
          </h1>
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
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
            className="flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
          >
            <Wallet className="h-4 w-4" />
            <span className="sm:hidden">Expense</span>
            <span className="hidden sm:inline">Quick Expense</span>
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden xl:flex-row xl:gap-3 2xl:gap-4">
        {/* Products */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="space-y-2 border-b border-slate-100 p-2.5 sm:space-y-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, SKU or barcode..."
                className="input-field py-2.5 pl-10 pr-11 text-sm sm:py-3 sm:text-[15px]"
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

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3 xl:p-4">
            {loading ? (
              <PageLoader label="Loading products..." />
            ) : products.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-3 h-12 w-12 text-slate-300" />
                <p className="font-semibold text-slate-500">No products found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-4">
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
                      <div className="mt-auto pt-2 text-left">
                        {parseFloat(product.discount_percent || "0") > 0 ? (
                          <p className="text-xs font-semibold text-slate-400 line-through">
                            {formatCurrency(product.price, currencySymbol)}
                          </p>
                        ) : null}
                        <p
                          className="text-lg font-extrabold text-primary-600"
                          title={formatCurrency(getProductSellPrice(product), currencySymbol)}
                        >
                          {formatCurrency(getProductSellPrice(product), currencySymbol)}
                        </p>
                        {parseFloat(product.discount_percent || "0") > 0 && (
                          <p className="text-[11px] font-bold text-emerald-600">
                            -{parseFloat(product.discount_percent).toFixed(0)}%
                          </p>
                        )}
                      </div>
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

        {/* Cart — always visible; items scroll; checkout can scroll on short screens */}
        <div className="pos-cart-panel h-[min(52vh,28rem)] w-full min-w-0 shrink-0 xl:h-full xl:w-[22rem] xl:min-w-[20rem] 2xl:w-[24rem]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2 sm:px-4 sm:py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Current Order</h2>
              <p className="text-xs font-medium text-slate-500">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Clear cart"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="min-h-[7.5rem] flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 sm:min-h-[9rem] sm:px-3 sm:py-2.5">
            {items.length === 0 ? (
              <div className="flex h-full min-h-[7rem] flex-col items-center justify-center py-6 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <ShoppingBag className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Tap a product to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const unitPrice = getProductSellPrice(item.product);
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <ProductAvatar
                          name={item.product.name}
                          imageUrl={item.product.image_url}
                          productId={item.product.id}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <p
                              className="line-clamp-2 text-sm font-bold leading-snug text-slate-800"
                              title={item.product.name}
                            >
                              {item.product.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                              aria-label="Remove item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p
                            className="mt-0.5 text-xs font-medium text-slate-500"
                            title={formatCurrency(unitPrice, currencySymbol)}
                          >
                            {formatCurrency(unitPrice, currencySymbol)}
                            {parseFloat(item.product.discount_percent || "0") > 0 && (
                              <span className="ml-1 text-emerald-600">
                                (-{parseFloat(item.product.discount_percent).toFixed(0)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Qty controls on their own row so they never get clipped */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[1.75rem] text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span
                          className="min-w-0 break-all text-right text-sm font-extrabold text-slate-900"
                          title={formatCurrency(lineTotal, currencySymbol)}
                        >
                          {formatCurrency(lineTotal, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="max-h-[58%] shrink-0 space-y-1.5 overflow-y-auto overscroll-contain border-t border-slate-100 bg-slate-50/40 p-2.5 sm:max-h-none sm:space-y-2 sm:p-3 xl:max-h-[55%] xl:overflow-y-auto">
            <div className="space-y-1 text-sm sm:space-y-2">
              <div className="flex items-center justify-between gap-2 font-medium text-slate-600">
                <span className="shrink-0">Subtotal</span>
                <span
                  className="min-w-0 break-all text-right font-semibold text-slate-800"
                  title={formatCurrency(subtotal, currencySymbol)}
                >
                  {formatCurrency(subtotal, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 font-medium text-slate-600">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-24 bg-white py-1.5 text-right text-sm font-semibold sm:w-28 sm:py-2"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 shrink-0">
                  <span className="font-medium text-slate-600">Tax %</span>
                  {tax > 0 && (
                    <p
                      className="text-[11px] font-semibold text-slate-400"
                      title={formatCurrency(tax, currencySymbol)}
                    >
                      {formatCurrency(tax, currencySymbol)}
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input-field w-24 bg-white py-1.5 text-right text-sm font-semibold sm:w-28 sm:py-2"
                  value={taxPercent || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value)) {
                      setTaxPercent(0);
                      return;
                    }
                    setTaxPercent(Math.min(100, Math.max(0, value)));
                  }}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3 py-2 shadow-lg sm:px-4 sm:py-3">
                <span className="shrink-0 text-xs font-semibold text-slate-300 sm:text-sm">Total Payable</span>
                <span
                  className="min-w-0 break-all text-right text-sm font-extrabold tracking-tight text-emerald-400 sm:text-lg"
                  title={formatCurrency(total, currencySymbol)}
                >
                  {formatCurrency(total, currencySymbol)}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:mb-1.5 sm:text-xs">
                <Banknote className="h-3.5 w-3.5" />
                Cash Received
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field bg-white py-1.5 text-base font-bold sm:py-2.5 sm:text-lg"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 sm:px-4 sm:py-3">
              <span className="shrink-0 text-sm font-bold text-emerald-800">Change</span>
              <span
                className="min-w-0 break-all text-right text-sm font-extrabold text-emerald-700 sm:text-lg"
                title={formatCurrency(change, currencySymbol)}
              >
                {formatCurrency(change, currencySymbol)}
              </span>
            </div>

            <input
              type="text"
              className="pos-checkout-note input-field bg-white text-sm"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <label className="pos-checkout-print flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={(e) => setPrintReceipt(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <Printer className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 leading-snug">Print receipt after sale</span>
            </label>

            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={processing || items.length === 0}
              className="btn-primary w-full py-2.5 text-sm shadow-lg shadow-emerald-500/25 sm:py-3.5 sm:text-base"
            >
              {processing ? (
                "Processing..."
              ) : (
                <>
                  {printReceipt ? <Printer className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                  {printReceipt ? "Complete Sale & Print" : "Complete Sale"}
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
