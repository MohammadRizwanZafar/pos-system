"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { formatCurrency, getApiErrorMessage } from "@/lib/utils";
import type { Category, Product } from "@/types";

interface ProductForm {
  name: string;
  category_id: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  stock: string;
  is_active: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  category_id: "",
  sku: "",
  barcode: "",
  price: "",
  cost: "",
  stock: "0",
  is_active: true,
};

export default function ProductsPage() {
  const canManage = isAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiGet<Product[]>("/products"),
        apiGet<Category[]>("/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setProducts([]);
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

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category_id: product.category_id?.toString() ?? "",
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      price: product.price,
      cost: product.cost ?? "",
      stock: product.stock.toString(),
      is_active: product.is_active,
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
      category_id: form.category_id ? Number(form.category_id) : null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      price: parseFloat(form.price),
      cost: form.cost ? parseFloat(form.cost) : null,
      stock: parseInt(form.stock, 10) || 0,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await apiPut(`/products/${editing.id}`, payload);
      } else {
        await apiPost("/products", payload);
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
    if (!confirm("Delete this product?")) return;
    try {
      await apiDelete(`/products/${id}`);
      loadData();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <Header
        title="Products"
        subtitle={canManage ? "Manage your product catalog" : "View product catalog"}
      >
        {canManage && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </Header>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              {canManage && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.category?.name ?? "—"}</td>
                  <td className="text-gray-500">{p.sku ?? "—"}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={p.is_active ? "badge-success" : "badge-gray"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setModalOpen(false)}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <select
                    className="input-field"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Price *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">SKU</label>
                  <input
                    className="input-field"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Barcode</label>
                  <input
                    className="input-field"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
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
