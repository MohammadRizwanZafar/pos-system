"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import PeriodFilter, { type Period } from "@/components/ui/PeriodFilter";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { formatCurrency, formatDate, getApiErrorMessage, getDateRange, localDateString } from "@/lib/utils";
import type { Expense, PaginatedData } from "@/types";

interface ExpenseForm {
  title: string;
  category: string;
  amount: string;
  expense_date: string;
  note: string;
}

const emptyForm = (): ExpenseForm => ({
  title: "",
  category: "",
  amount: "",
  expense_date: localDateString(),
  note: "",
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { from_date, to_date } = getDateRange(period, customFrom, customTo);
      const data = await apiGet<PaginatedData<Expense>>("/expenses", {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        from_date,
        to_date,
      });
      setExpenses(data.items);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch {
      setExpenses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    const timer = setTimeout(loadExpenses, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, period, customFrom, customTo]);

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      category: expense.category ?? "",
      amount: expense.amount,
      expense_date: expense.expense_date.split("T")[0],
      note: expense.note ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiPost("/expenses", {
        title: form.title,
        category: form.category || null,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        note: form.note || null,
      });
      setForm(emptyForm());
      setShowForm(false);
      loadExpenses();
    } catch (err) {
      setError(getApiErrorMessage(err));
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
      await apiPut(`/expenses/${editing.id}`, {
        title: form.title,
        category: form.category || null,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        note: form.note || null,
      });
      setModalOpen(false);
      setEditing(null);
      loadExpenses();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;

    try {
      await apiDelete(`/expenses/${id}`);
      loadExpenses();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <Header title="Expenses" subtitle="Track store expenses">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setForm(emptyForm());
            setError("");
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </Header>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                required
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <input
                className="input-field"
                placeholder="e.g. Utilities, Rent (optional)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date *</label>
              <input
                required
                type="date"
                className="input-field"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Note</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Expense"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <PeriodFilter
        period={period}
        onPeriodChange={(value) => {
          setPeriod(value);
          setPage(1);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={(value) => {
          setCustomFrom(value);
          setPage(1);
        }}
        onCustomToChange={(value) => {
          setCustomTo(value);
          setPage(1);
        }}
      />

      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by title or category..."
        className="mb-4 max-w-md"
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Added By</th>
              <th>Note</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No expenses recorded
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{formatDate(exp.expense_date)}</td>
                  <td className="font-medium" title={exp.title}>{exp.title}</td>
                  <td>
                    {exp.category ? (
                      <span className="badge-gray">{exp.category}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="font-semibold text-red-600" title={formatCurrency(exp.amount)}>
                    {formatCurrency(exp.amount)}
                  </td>
                  <td>{exp.user?.name ?? "—"}</td>
                  <td className="max-w-xs truncate text-gray-500" title={exp.note ?? ""}>
                    {exp.note ?? "—"}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(exp)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
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
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          onPageChange={setPage}
        />
      </div>

      {modalOpen && editing && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Expense</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title *</label>
                  <input
                    required
                    className="input-field"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <input
                    className="input-field"
                    placeholder="Optional"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Date *</label>
                  <input
                    required
                    type="date"
                    className="input-field"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Note</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
