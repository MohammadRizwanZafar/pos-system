"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Store,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Pagination, SearchInput, usePagedList } from "@/components/ui/TableControls";
import { apiGet, apiPost } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { Shop, User } from "@/types";

interface ShopForm {
  name: string;
  address: string;
  phone: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
}

interface CashierForm {
  name: string;
  email: string;
  password: string;
}

const emptyShopForm: ShopForm = {
  name: "",
  address: "",
  phone: "",
  owner_name: "",
  owner_email: "",
  owner_password: "",
};

const emptyCashierForm: CashierForm = {
  name: "",
  email: "",
  password: "",
};

function roleName(user: User): string {
  const role = user.roles?.[0]?.name;
  if (role === "admin") return "Owner";
  if (role === "cashier") return "Cashier";
  return role ?? "—";
}

export default function PlatformShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [shopDetails, setShopDetails] = useState<Record<number, Shop>>({});
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [cashierModalShopId, setCashierModalShopId] = useState<number | null>(null);
  const [shopForm, setShopForm] = useState<ShopForm>(emptyShopForm);
  const [cashierForm, setCashierForm] = useState<CashierForm>(emptyCashierForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { paged, page, setPage, totalPages, total, perPage } = usePagedList(
    shops,
    search,
    (s, q) =>
      s.name.toLowerCase().includes(q) ||
      (s.owner?.email ?? "").toLowerCase().includes(q) ||
      (s.owner?.name ?? "").toLowerCase().includes(q)
  );

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Shop[]>("/platform/shops");
      setShops(Array.isArray(data) ? data : []);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const loadShopDetails = async (shopId: number) => {
    try {
      const data = await apiGet<Shop>(`/platform/shops/${shopId}`);
      setShopDetails((prev) => ({ ...prev, [shopId]: data }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const toggleExpand = async (shopId: number) => {
    if (expandedId === shopId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(shopId);
    if (!shopDetails[shopId]) {
      await loadShopDetails(shopId);
    }
  };

  const handleCreateShop = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiPost("/platform/shops", shopForm);
      setShopModalOpen(false);
      setShopForm(emptyShopForm);
      await loadShops();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCashier = async (e: FormEvent) => {
    e.preventDefault();
    if (!cashierModalShopId) return;
    setSaving(true);
    setError("");
    try {
      await apiPost(`/platform/shops/${cashierModalShopId}/cashiers`, cashierForm);
      setCashierModalShopId(null);
      setCashierForm(emptyCashierForm);
      await loadShops();
      await loadShopDetails(cashierModalShopId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shops</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each shop has its own owner and cashiers — data is fully separate
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShopForm(emptyShopForm);
            setShopModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add New Shop
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Shops</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{shops.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Shops</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {shops.filter((s) => s.is_active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Cashiers</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {shops.reduce((sum, s) => sum + (s.cashiers_count ?? 0), 0)}
          </p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by shop name or owner..."
        className="max-w-md"
      />

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading shops...
          </div>
        ) : paged.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Store className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 font-semibold text-slate-700">No shops yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first shop with owner login details
            </p>
          </div>
        ) : (
          paged.map((shop) => {
            const expanded = expandedId === shop.id;
            const detail = shopDetails[shop.id];
            const staff = detail?.users ?? [];
            const cashiers = staff.filter((u) => u.roles?.[0]?.name === "cashier");

            return (
              <div
                key={shop.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(shop.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{shop.name}</p>
                      <span
                        className={
                          shop.is_active ? "badge-success" : "badge-gray"
                        }
                      >
                        {shop.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 truncate text-sm text-slate-500"
                      title={`Owner: ${shop.owner?.email ?? "—"} · ${shop.cashiers_count ?? 0} cashier(s)`}
                    >
                      Owner: {shop.owner?.email ?? "—"} · {shop.cashiers_count ?? 0}{" "}
                      cashier(s)
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Owner Login
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {shop.owner?.name ?? detail?.owner?.name ?? "—"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {shop.owner?.email ?? detail?.owner?.email ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Shop Info
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {shop.address || "No address"}
                        </p>
                        <p className="text-sm text-slate-600">{shop.phone || "No phone"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700">Cashiers</p>
                      </div>
                      <button
                        onClick={() => {
                          setError("");
                          setCashierForm(emptyCashierForm);
                          setCashierModalShopId(shop.id);
                        }}
                        className="btn-secondary text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add Cashier
                      </button>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-500">
                                Loading staff...
                              </td>
                            </tr>
                          ) : (
                            staff.map((user) => (
                              <tr key={user.id}>
                                <td className="font-medium">{user.name}</td>
                                <td className="text-slate-500">{user.email}</td>
                                <td>
                                  <span className="badge-success">{roleName(user)}</span>
                                </td>
                                <td>
                                  <span
                                    className={
                                      user.is_active ? "badge-success" : "badge-gray"
                                    }
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {cashiers.length === 0 && staff.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        No cashiers yet — owner can also add cashiers from shop Users page
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        {!loading && total > perPage && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {shopModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add New Shop</h2>
              <button onClick={() => setShopModalOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateShop} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Shop Name *</label>
                <input
                  required
                  className="input-field"
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="Ali General Store"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Address</label>
                  <input
                    className="input-field"
                    value={shopForm.address}
                    onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input
                    className="input-field"
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Owner Account</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Give this login to the shop owner — they get full access
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Owner Name *</label>
                <input
                  required
                  className="input-field"
                  value={shopForm.owner_name}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, owner_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Owner Email *</label>
                  <input
                    required
                    type="email"
                    className="input-field"
                    value={shopForm.owner_email}
                    onChange={(e) =>
                      setShopForm({ ...shopForm, owner_email: e.target.value })
                    }
                    placeholder="ali@store.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Password *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    className="input-field"
                    value={shopForm.owner_password}
                    onChange={(e) =>
                      setShopForm({ ...shopForm, owner_password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShopModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Creating..." : "Create Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cashierModalShopId && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Cashier</h2>
              <button onClick={() => setCashierModalShopId(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleAddCashier} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  required
                  className="input-field"
                  value={cashierForm.name}
                  onChange={(e) =>
                    setCashierForm({ ...cashierForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  required
                  type="email"
                  className="input-field"
                  value={cashierForm.email}
                  onChange={(e) =>
                    setCashierForm({ ...cashierForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password *</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  className="input-field"
                  value={cashierForm.password}
                  onChange={(e) =>
                    setCashierForm({ ...cashierForm, password: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashierModalShopId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Adding..." : "Add Cashier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
