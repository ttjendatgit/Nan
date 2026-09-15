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
import Modal from "@/components/ui/Modal";
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
  "admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";
const ICON_BTN =
  "admin-focus-ring rounded-lg p-2 transition-colors";
const SECTION_KICKER_CLS =
  "text-[10px] font-mono uppercase tracking-[0.14em]";

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

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  function closeDeleteModal() {
    if (deleteBusy) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!token || !pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteCategory(pendingDelete.id, token);
      if (editing === pendingDelete.id) startNew();
      setPendingDelete(null);
      await loadCategories();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeleteBusy(false);
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
                className="admin-focus-ring rounded text-xs transition-colors hover:underline"
                style={{ color: "var(--admin-primary)" }}
              >
                + Mới
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Tên danh mục <span style={{ color: "var(--admin-danger)" }}>*</span>
              </label>
              <input
                id="category-name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Quạt giấy truyền thống"
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="category-slug" className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Slug
              </label>
              <input
                id="category-slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="quat-giay-truyen-thong"
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="category-description" className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Mô tả
              </label>
              <textarea
                id="category-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Mô tả danh mục..."
                className="admin-input resize-none"
              />
            </div>

            <p className={`${SECTION_KICKER_CLS} pt-1`} style={{ color: "var(--admin-text-subtle)" }}>
              Hiển thị
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className="admin-focus-ring relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{ background: form.isActive ? "var(--admin-toggle-on)" : "var(--admin-toggle-off)" }}
                aria-label="Hiển thị danh mục"
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
                  <img src={localPreview} alt="Ảnh xem trước" className="h-full w-full object-cover" />
                  <button type="button" onClick={clearImage} className="admin-focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors" aria-label="Xóa ảnh">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
                    Sẽ được tải lên khi lưu
                  </div>
                </div>
              )}

              {form.imageUrl && !localPreview && (
                <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg" style={{ border: "1px solid var(--admin-border-strong)" }}>
                  <Image src={form.imageUrl} alt={form.name || "Ảnh danh mục"} fill className="object-cover" sizes="400px" />
                  <button type="button" onClick={clearImage} className="admin-focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors" aria-label="Xóa ảnh">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}

              {!form.imageUrl && !localPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm transition-colors"
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
                  className="admin-focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs transition-colors"
                  style={{ border: "1px dashed var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Thay ảnh khác
                </button>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleFileSelect} />
            </div>

            {formError && (
              <p role="alert" className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {formError}
              </p>
            )}
            {formSuccess && (
              <p role="status" aria-live="polite" className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--admin-success)", background: "var(--admin-success-soft)", border: "1px solid rgba(21,128,61,0.20)" }}>
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
          <button onClick={loadCategories} className="admin-focus-ring rounded text-sm transition-colors hover:underline" style={{ color: "var(--admin-text-subtle)" }}>
            Làm mới
          </button>
        </div>

        {/* One shared surface for every state, matching the Option Catalog / Product list --
            keeps the panel's frame stable across loading/error/empty/populated instead of a
            stack of repeated, individually-shadowed cards. */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}
        >
          {listLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-text-subtle)" }} />
            </div>
          )}

          {!listLoading && listError && (
            <p role="alert" className="text-sm px-4 py-3" style={{ color: "var(--admin-danger)" }}>
              {listError}
            </p>
          )}

          {!listLoading && !listError && categories.length === 0 && (
            <p className="text-sm py-12 text-center" style={{ color: "var(--admin-text-subtle)" }}>
              Chưa có danh mục nào. Tạo danh mục đầu tiên.
            </p>
          )}

          {!listLoading && !listError && categories.map((cat, idx) => {
            const isEditing = editing === cat.id;
            return (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid var(--admin-border)",
                  background: isEditing ? "var(--admin-primary-soft)" : "transparent",
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
                    className={ICON_BTN}
                    style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
                    aria-label={`Chỉnh sửa "${cat.name}"`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Destructive action stays visually quiet at rest (same weight as a tertiary
                      control) and only reads as dangerous on hover/focus, matching the pattern
                      already approved in the Option Catalog and Products list. */}
                  <button
                    onClick={() => { setPendingDelete({ id: cat.id, name: cat.name }); setDeleteError(null); }}
                    className={`${ICON_BTN} hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]`}
                    style={{ color: "var(--admin-text-subtle)" }}
                    aria-label={`Xóa "${cat.name}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete confirmation modal -- same guard/behavior as before, now presented consistently
          with the rest of the admin instead of a native browser confirm()/alert(). */}
      <Modal open={pendingDelete !== null} onClose={closeDeleteModal} labelledBy="delete-category-title" maxWidthClassName="max-w-sm">
        {pendingDelete && (
          <div className="p-5">
            <h2 id="delete-category-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
              Xóa danh mục &ldquo;{pendingDelete.name}&rdquo;?
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--admin-text-muted)" }}>
              Thao tác này không thể hoàn tác.
            </p>

            {deleteError && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--admin-danger)" }}>{deleteError}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteBusy}
                className="admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
                style={{
                  borderColor: "rgba(220,38,38,0.30)",
                  background: "var(--admin-danger-soft)",
                  color: "var(--admin-danger)",
                  border: "1px solid rgba(220,38,38,0.30)",
                }}
              >
                {deleteBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Xóa vĩnh viễn
              </button>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteBusy}
                className="admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
