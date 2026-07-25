"use client";

import { FormEvent, useEffect, useState } from "react";
import { Banknote, Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import PeriodFilter, { type Period } from "@/components/ui/PeriodFilter";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { formatCurrency, formatDate, getApiErrorMessage, getDateRange, localDateString } from "@/lib/utils";
import type { OpeningCash, PaginatedData } from "@/types";

interface OpeningCashForm {
  amount: string;
  business_date: string;
  note: string;
}

const emptyForm = (): OpeningCashForm => ({
  amount: "",
  business_date: localDateString(),
  note: "",
});

export default function OpeningCashPage() {
  const [records, setRecords] = useState<OpeningCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpeningCash | null>(null);
  const [form, setForm] = useState<OpeningCashForm>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [todayRecord, setTodayRecord] = useState<OpeningCash | null>(null);
  const perPage = 10;

  const loadToday = async () => {
    try {
      const today = await apiGet<OpeningCash | null>("/opening-cashes/today");
      setTodayRecord(today);
    } catch {
      setTodayRecord(null);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { from_date, to_date } = getDateRange(period, customFrom, customTo);
      const data = await apiGet<PaginatedData<OpeningCash>>("/opening-cashes", {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        from_date,
        to_date,
      });
      setRecords(data.items);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    const timer = setTimeout(loadRecords, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, period, customFrom, customTo]);

  const openEdit = (record: OpeningCash) => {
    setEditing(record);
    setForm({
      amount: record.amount,
      business_date: record.business_date.split("T")[0],
      note: record.note ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiPost("/opening-cashes", {
        amount: parseFloat(form.amount),
        business_date: form.business_date,
        note: form.note || null,
      });
      setForm(emptyForm());
      setShowForm(false);
      setPage(1);
      await Promise.all([loadRecords(), loadToday()]);
    } catch (err) {
      setError(getApiErrorMessage(err) || "Failed to save opening cash");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");

    try {
      await apiPut(`/opening-cashes/${editing.id}`, {
        amount: parseFloat(form.amount),
        business_date: form.business_date,
        note: form.note || null,
      });
      setModalOpen(false);
      setEditing(null);
      await Promise.all([loadRecords(), loadToday()]);
    } catch (err) {
      setError(getApiErrorMessage(err) || "Failed to update opening cash");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this opening cash record?")) return;
    try {
      await apiDelete(`/opening-cashes/${id}`);
      await Promise.all([loadRecords(), loadToday()]);
    } catch (err) {
      alert(getApiErrorMessage(err) || "Failed to delete");
    }
  };

  return (
    <div>
      <Header
        title="Opening Cash"
        subtitle="Cash in drawer when the shop opens for the day"
      >
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm());
            setShowForm((v) => !v);
            setError("");
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Set Opening Cash
        </button>
      </Header>

      {todayRecord ? (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Today&apos;s Opening Cash</p>
            <p className="text-2xl font-extrabold text-emerald-900" title={formatCurrency(todayRecord.amount)}>
              {formatCurrency(todayRecord.amount)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Today&apos;s opening cash is not set yet. Add the cash already in the shop when you open.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-5 space-y-4">
          <h3 className="font-bold text-slate-800">Set Opening Cash</h3>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.business_date}
                onChange={(e) => setForm({ ...form, business_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">Amount (Rs.)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">Note</label>
              <input
                type="text"
                className="input-field"
                placeholder="Optional"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <PeriodFilter
        period={period}
        onPeriodChange={(p) => {
          setPeriod(p);
          setPage(1);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by note or user..."
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Recorded By</th>
                <th className="px-4 py-3 font-bold">Note</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No opening cash records found
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-3">{formatDate(row.business_date)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700" title={formatCurrency(row.amount)}>
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3">{row.user?.name ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={row.note ?? ""}>
                      {row.note ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          onPageChange={setPage}
        />
      </div>

      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Edit Opening Cash</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={form.business_date}
                  onChange={(e) => setForm({ ...form, business_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Note</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
