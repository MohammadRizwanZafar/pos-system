"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { Pagination, SearchInput, usePagedList } from "@/components/ui/TableControls";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryForm {
  name: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  is_active: true,
};

export default function CategoriesPage() {
  const canManage = isAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { paged, page, setPage, totalPages, total, perPage } = usePagedList(
    categories,
    search,
    (c, q) => c.name.toLowerCase().includes(q) || (c.slug ?? "").toLowerCase().includes(q)
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await apiGet<Category[]>("/categories");
      setCategories(cats);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      is_active: category.is_active,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await apiPut(`/categories/${editing.id}`, payload);
      } else {
        await apiPost("/categories", payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiDelete(`/categories/${id}`);
      loadData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <Header
        title="Categories"
        subtitle={canManage ? "Manage product categories" : "View product categories"}
      >
        {canManage && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </Header>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search categories..."
        className="mb-4 max-w-md"
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              {canManage && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="py-8 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              paged.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-gray-500">{c.slug}</td>
                  <td>
                    <span className={c.is_active ? "badge-success" : "badge-gray"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  required
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Active
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
