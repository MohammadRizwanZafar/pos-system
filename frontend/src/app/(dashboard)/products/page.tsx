"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import ProductAvatar from "@/components/ui/ProductAvatar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { formatCurrency, getApiErrorMessage } from "@/lib/utils";
import type { Category, PaginatedData, Product } from "@/types";

interface ProductForm {
  name: string;
  category_id: string;
  price: string;
  discount_percent: string;
  cost: string;
  stock: string;
  is_active: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  category_id: "",
  price: "",
  discount_percent: "0",
  cost: "",
  stock: "0",
  is_active: true,
};

export default function ProductsPage() {
  const canManage = isAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedData<Product>>("/products", {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
      });
      setProducts(data.items);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiGet<Category[]>("/categories", { active_only: 1 })
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
    // loadData intentionally follows current page/search state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    resetImageState();
    setError("");
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category_id: product.category_id?.toString() ?? "",
      price: product.price,
      discount_percent: product.discount_percent?.toString() ?? "0",
      cost: product.cost ?? "",
      stock: product.stock.toString(),
      is_active: product.is_active,
    });
    setImageFile(null);
    setImagePreview(product.image_url);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
    setModalOpen(true);
  };

  const handleImageChange = (file: File | null) => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    if (!file) {
      setImageFile(null);
      setImagePreview(editing && !removeImage ? editing.image_url : null);
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = new FormData();
    body.append("name", form.name);
    if (form.category_id) body.append("category_id", form.category_id);
    body.append("price", form.price);
    body.append("discount_percent", form.discount_percent || "0");
    if (form.cost) body.append("cost", form.cost);
    body.append("stock", form.stock || "0");
    body.append("is_active", form.is_active ? "1" : "0");
    if (imageFile) body.append("image", imageFile);
    if (editing && removeImage && !imageFile) body.append("remove_image", "1");

    try {
      if (editing) {
        await apiPost(`/products/${editing.id}`, body);
      } else {
        await apiPost("/products", body);
      }
      setModalOpen(false);
      resetImageState();
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

  const previewName = form.name || editing?.name || "Product";

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

      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by name, SKU, barcode or category..."
        className="mb-4 max-w-md"
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Cost</th>
              <th>Stock</th>
              <th>Status</th>
              {canManage && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} className="py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ProductAvatar
                        name={p.name}
                        imageUrl={p.image_url}
                        productId={p.id}
                        size="sm"
                        className="relative origin-left cursor-zoom-in transition-transform duration-200 ease-out hover:z-20 hover:scale-[2.75] hover:shadow-xl"
                      />
                      <span className="font-medium" title={p.name}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category?.name ?? "—"}</td>
                  <td className="text-gray-500">{p.sku ?? "—"}</td>
                  <td className="font-mono text-gray-500">{p.barcode ?? "—"}</td>
                  <td title={formatCurrency(p.price)}>{formatCurrency(p.price)}</td>
                  <td>
                    {parseFloat(p.discount_percent || "0") > 0 ? (
                      <span className="font-semibold text-emerald-700">
                        {parseFloat(p.discount_percent).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td title={p.cost != null && p.cost !== "" ? formatCurrency(p.cost) : ""}>
                    {p.cost != null && p.cost !== "" ? formatCurrency(p.cost) : "—"}
                  </td>
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
                <label className="mb-1.5 block text-sm font-medium">
                  Product Image <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <ProductAvatar
                    name={previewName}
                    imageUrl={imagePreview}
                    productId={editing?.id ?? 0}
                    size="lg"
                  />
                  <div className="flex flex-1 flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary justify-start"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-left text-sm font-semibold text-red-500 hover:text-red-600"
                      >
                        Remove image
                      </button>
                    )}
                    <p className="text-xs text-slate-400">
                      JPG, PNG or WebP up to 4MB. If empty, name avatar is used.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  required
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <SearchableSelect
                    value={form.category_id}
                    onChange={(value) => setForm({ ...form, category_id: value })}
                    options={categories.map((c) => ({
                      value: c.id.toString(),
                      label: c.name,
                    }))}
                    placeholder="Select category..."
                  />
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input-field"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    placeholder="0"
                  />
                </div>
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
