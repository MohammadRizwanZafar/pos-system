"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { PaginatedData, User } from "@/types";

function roleLabel(role?: string): string {
  if (role === "admin") return "Owner";
  if (role === "cashier") return "Cashier";
  return "—";
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: "admin" | "cashier";
  is_active: boolean;
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "cashier",
  is_active: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedData<User>>("/users", {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
      });
      setUsers(data.items);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.roles[0]?.name === "admin" ? "admin" : "cashier",
      is_active: user.is_active,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      is_active: form.is_active,
    };
    if (!editing || editing.roles[0]?.name === "cashier") {
      payload.role = "cashier";
    }
    if (form.password) payload.password = form.password;

    try {
      if (editing) {
        await apiPut(`/users/${editing.id}`, payload);
      } else {
        if (!form.password) {
          setError("Password is required for new users");
          setSaving(false);
          return;
        }
        await apiPost("/users", payload);
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header title="Users" subtitle="Manage cashiers for your shop">
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Cashier
        </button>
      </Header>

      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by name or email..."
        className="mb-4 max-w-md"
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td className="text-gray-500">{user.email}</td>
                  <td>
                    <span className="badge-success capitalize">
                      {roleLabel(user.roles[0]?.name)}
                    </span>
                  </td>
                  <td>
                    <span className={user.is_active ? "badge-success" : "badge-gray"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="btn-secondary text-xs"
                      >
                        Edit
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit User" : "Add Cashier"}
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

              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  required
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Password {editing ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editing}
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {editing && editing.roles[0]?.name === "admin" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <input className="input-field bg-gray-50" value="Owner" disabled />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <input className="input-field bg-gray-50" value="Cashier" disabled />
                </div>
              )}

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
