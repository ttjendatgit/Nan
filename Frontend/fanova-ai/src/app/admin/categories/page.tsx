"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Upload,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import {
  getCategories,
  createCategoryWithImage,
  updateCategoryWithImage,
  deleteCategory,
} from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  imageUrl: "",
};

const PRIMARY_BTN =
  "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";

export default function AdminCategoriesPage() {
  // Auth
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Categories list
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Form
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Image selection
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("nan_admin_token");
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (token) loadCategories();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      sessionStorage.setItem("nan_admin_token", res.accessToken);
      window.location.reload();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    sessionStorage.removeItem("nan_admin_token");
    setCategories([]);
  }

  async function loadCategories() {
    setListLoading(true);
    setListError(null);
    try {
      const result = await getCategories({ pageSize: 100 });
      setCategories(result.items);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setListLoading(false);
    }
  }

  function startEdit(cat: ProductCategory) {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
      imageUrl: cat.imageUrl ?? "",
    });
    setSelectedFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setFormError(null);
    setFormSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setSelectedFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setFormError(null);
    setFormSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug:
        prev.slug === "" || prev.slug === slugify(prev.name)
          ? slugify(value)
          : prev.slug,
    }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setSelectedFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.slug) fd.append("slug", form.slug);
      if (form.description) fd.append("description", form.description);
      fd.append("isActive", String(form.isActive));
      if (selectedFile) fd.append("image", selectedFile);

      if (editing) {
        const result = await updateCategoryWithImage(editing, fd, token);
        setForm((prev) => ({ ...prev, imageUrl: result.imageUrl ?? "" }));
        setSelectedFile(null);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
        setFormSuccess("Đã cập nhật danh mục.");
      } else {
        await createCategoryWithImage(fd, token);
        setFormSuccess("Đã tạo danh mục.");
        startNew();
      }
      await loadCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!token) return;
    if (!confirm(`Xóa "${name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteCategory(id, token);
      await loadCategories();
      if (editing === id) startNew();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }

  // Suppress unused warning for handleLogout
  void handleLogout;

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--admin-canvas)" }}
      >
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl p-8 space-y-5"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 4px 16px rgba(8,51,125,0.08)",
          }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--admin-text)" }}>
              Đăng nhập Admin
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
              Quản lý danh mục
            </p>
          </div>
          {loginError && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: "var(--admin-danger)",
                background: "var(--admin-danger-soft)",
                border: "1px solid rgba(220,38,38,0.20)",
              }}
            >
              {loginError}
            </p>
          )}
          <div className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="admin-input" />
            <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required className="admin-input" />
          </div>
          <button type="submit" disabled={loginLoading} className={PRIMARY_BTN} style={{ background: "var(--admin-primary)" }}>
            {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-8"
      style={{ color: "var(--admin-text)" }}
    >
      {/* Form panel */}
      <div className="lg:col-span-2">
        <div
          className="rounded-2xl p-6 space-y-5 sticky top-6"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 1px 4px rgba(8,51,125,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
              {editing ? "Chỉnh sửa danh mục" : "Danh mục mới"}
            </h2>
            {editing && (
              <button
                onClick={startNew}
                className="text-xs transition-colors hover:underline"
                style={{ color: "var(--admin-primary)" }}
              >
                + Mới
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Tên danh mục <span style={{ color: "var(--admin-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Quạt giấy truyền thống"
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="quat-giay-truyen-thong"
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Mô tả danh mục..."
                className="admin-input resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: form.isActive ? "var(--admin-toggle-on)" : "var(--admin-toggle-off)" }}
                aria-label="Toggle active"
                aria-checked={form.isActive}
                role="switch"
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: form.isActive ? "translateX(18px)" : "translateX(2px)" }}
                />
              </button>
              <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                {form.isActive ? "Hiển thị" : "Ẩn"}
              </span>
            </div>

            {/* Image section */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Hình ảnh
              </label>

              {localPreview && (
                <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg" style={{ border: "2px dashed var(--admin-primary)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-full bg-black/50 p-1 hover:bg-black/70 transition-colors" aria-label="Xóa ảnh">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
                    Sẽ được tải lên khi lưu
                  </div>
                </div>
              )}

              {form.imageUrl && !localPreview && (
                <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg" style={{ border: "1px solid var(--admin-border-strong)" }}>
                  <Image src={form.imageUrl} alt="Current image" fill className="object-cover" sizes="400px" />
                  <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-full bg-black/50 p-1 hover:bg-black/70 transition-colors" aria-label="Xóa ảnh">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}

              {!form.imageUrl && !localPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm transition-colors"
                  style={{ border: "2px dashed var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
                >
                  <Upload className="h-4 w-4" />
                  Chọn ảnh từ máy tính
                </button>
              )}

              {form.imageUrl && !localPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs transition-colors"
                  style={{ border: "1px dashed var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Thay ảnh khác
                </button>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleFileSelect} />
            </div>

            {formError && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--admin-success)", background: "var(--admin-success-soft)", border: "1px solid rgba(21,128,61,0.20)" }}>
                {formSuccess}
              </p>
            )}

            <button type="submit" disabled={formLoading} className={PRIMARY_BTN} style={{ background: "var(--admin-primary)" }}>
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Cập nhật danh mục" : "Tạo danh mục"}
            </button>
          </form>
        </div>
      </div>

      {/* List panel */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
            Danh mục ({categories.length})
          </h2>
          <button onClick={loadCategories} className="text-sm transition-colors hover:underline" style={{ color: "var(--admin-text-subtle)" }}>
            Làm mới
          </button>
        </div>

        {listLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-text-subtle)" }} />
          </div>
        )}

        {listError && (
          <p className="text-sm rounded-lg px-4 py-3" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
            {listError}
          </p>
        )}

        {!listLoading && categories.length === 0 && !listError && (
          <p className="text-sm py-12 text-center" style={{ color: "var(--admin-text-subtle)" }}>
            Chưa có danh mục nào. Tạo danh mục đầu tiên.
          </p>
        )}

        <div className="space-y-3">
          {categories.map((cat) => {
            const isEditing = editing === cat.id;
            return (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-xl p-4 transition-colors"
                style={{
                  border: isEditing ? "1px solid rgba(8,51,125,0.35)" : "1px solid var(--admin-border)",
                  background: isEditing ? "var(--admin-primary-soft)" : "var(--admin-surface)",
                  boxShadow: isEditing ? "none" : "0 1px 3px rgba(8,51,125,0.04)",
                }}
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--admin-surface-muted)" }}>
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center" style={{ color: "var(--admin-border-strong)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 20M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate" style={{ color: "var(--admin-text)" }}>{cat.name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>{cat.slug}</p>
                  <span className={`mt-1 inline-block admin-badge ${cat.isActive ? "admin-badge-active" : "admin-badge-inactive"}`}>
                    {cat.isActive ? "Hiển thị" : "Ẩn"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="rounded-lg p-2 transition-colors"
                    style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
                    aria-label="Chỉnh sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="rounded-lg p-2 transition-colors"
                    style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)" }}
                    aria-label="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
