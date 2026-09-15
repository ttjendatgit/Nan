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
  getProducts,
  createProductWithImage,
  updateProductWithImage,
  deleteProduct,
} from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import ContentBlockEditor from "@/components/product/ContentBlockEditor";
import ProductOptionAssignments from "@/components/admin/ProductOptionAssignments";
import Modal from "@/components/ui/Modal";
import type { Product, ProductCategory } from "@/types/catalog";

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
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  basePrice: "",
  minQuantity: "1",
  estimatedProductionDays: "7",
  isCustomizable: true,
  isActive: true,
  imageUrl: "",
};

// ─── Shared inline styles (light admin system) ─────────────────────────────
const INPUT_CLS =
  "admin-input";
const LABEL_CLS =
  "block text-xs font-medium mb-1.5";
const PRIMARY_BTN =
  "admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";
const ICON_BTN_EDIT =
  "admin-focus-ring rounded-lg p-2 transition-colors";
const ICON_BTN_DEL =
  "admin-focus-ring rounded-lg p-2 transition-colors";
const SECTION_KICKER_CLS =
  "text-[10px] font-mono uppercase tracking-[0.14em]";

export default function AdminProductsPage() {
  // Auth
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
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
    if (token) {
      loadProducts();
      loadCategories();
    }
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
    setProducts([]);
    setCategories([]);
  }

  async function loadProducts() {
    setListLoading(true);
    setListError(null);
    try {
      const result = await getProducts({ pageSize: 100 });
      setProducts(result.items);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setListLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const result = await getCategories({ pageSize: 100, activeOnly: true });
      setCategories(result.items);
    } catch {
      // non-critical
    }
  }

  function startEdit(p: Product) {
    setEditing(p.id);
    setForm({
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      basePrice: String(p.basePrice),
      minQuantity: String(p.minQuantity),
      estimatedProductionDays: String(p.estimatedProductionDays),
      isCustomizable: p.isCustomizable,
      isActive: p.isActive,
      imageUrl: p.imageUrl ?? "",
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
      fd.append("categoryId", form.categoryId);
      fd.append("name", form.name);
      if (form.slug) fd.append("slug", form.slug);
      if (form.description) fd.append("description", form.description);
      fd.append("basePrice", form.basePrice || "0");
      fd.append("minQuantity", form.minQuantity || "1");
      fd.append("estimatedProductionDays", form.estimatedProductionDays || "7");
      fd.append("isCustomizable", String(form.isCustomizable));
      fd.append("isActive", String(form.isActive));
      if (selectedFile) fd.append("image", selectedFile);

      if (editing) {
        const result = await updateProductWithImage(editing, fd, token);
        setForm((prev) => ({ ...prev, imageUrl: result.imageUrl ?? "" }));
        setSelectedFile(null);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
        setFormSuccess("Đã cập nhật sản phẩm.");
      } else {
        await createProductWithImage(fd, token);
        setFormSuccess("Đã tạo sản phẩm.");
        startNew();
      }
      await loadProducts();
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
      await deleteProduct(pendingDelete.id, token);
      if (editing === pendingDelete.id) startNew();
      setPendingDelete(null);
      await loadProducts();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeleteBusy(false);
    }
  }

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
              Quản lý sản phẩm
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
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className={PRIMARY_BTN}
            style={{ background: "var(--admin-primary)" }}
          >
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
      {/* Form panel -- not sticky: unlike the Option Catalog's short form, this panel embeds the
          Content Block Editor and Option Assignments below the core fields, so its height is
          effectively unbounded once a product has real content. A sticky panel that tall would
          "freeze" mid-scroll for the length of its own content instead of scrolling normally. */}
      <div className="lg:col-span-2">
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 1px 4px rgba(8,51,125,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
              {editing ? "Chỉnh sửa sản phẩm" : "Sản phẩm mới"}
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

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Category */}
            <div>
              <label htmlFor="product-category" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Danh mục <span style={{ color: "var(--admin-danger)" }}>*</span>
              </label>
              <select
                id="product-category"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                required
                className="admin-input"
              >
                <option value="">Chọn danh mục…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="product-name" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Tên sản phẩm <span style={{ color: "var(--admin-danger)" }}>*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Quạt giấy in logo"
                className="admin-input"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="product-slug" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Slug
              </label>
              <input
                id="product-slug"
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="quat-giay-in-logo"
                className="admin-input"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="product-description" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Mô tả
              </label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                placeholder="Mô tả sản phẩm..."
                className="admin-input resize-none"
              />
            </div>

            <p className={`${SECTION_KICKER_CLS} pt-1`} style={{ color: "var(--admin-text-subtle)" }}>
              Giá &amp; sản xuất
            </p>

            {/* Price row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="product-base-price" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                  Giá gốc (VND) <span style={{ color: "var(--admin-danger)" }}>*</span>
                </label>
                <input
                  id="product-base-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, basePrice: e.target.value }))
                  }
                  required
                  placeholder="150000"
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="product-min-quantity" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                  SL tối thiểu
                </label>
                <input
                  id="product-min-quantity"
                  type="number"
                  min="1"
                  value={form.minQuantity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minQuantity: e.target.value }))
                  }
                  className="admin-input"
                />
              </div>
            </div>

            {/* Production days */}
            <div>
              <label htmlFor="product-production-days" className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Ngày sản xuất ước tính
              </label>
              <input
                id="product-production-days"
                type="number"
                min="1"
                value={form.estimatedProductionDays}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estimatedProductionDays: e.target.value,
                  }))
                }
                className="admin-input"
              />
            </div>

            <p className={`${SECTION_KICKER_CLS} pt-1`} style={{ color: "var(--admin-text-subtle)" }}>
              Hiển thị
            </p>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      isCustomizable: !prev.isCustomizable,
                    }))
                  }
                  className="admin-focus-ring relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    background: form.isCustomizable
                      ? "var(--admin-toggle-on)"
                      : "var(--admin-toggle-off)",
                  }}
                  aria-label="Tùy chỉnh được"
                  aria-checked={form.isCustomizable}
                  role="switch"
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                    style={{
                      transform: form.isCustomizable
                        ? "translateX(18px)"
                        : "translateX(2px)",
                    }}
                  />
                </button>
                <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Tùy chỉnh được
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className="admin-focus-ring relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    background: form.isActive
                      ? "var(--admin-toggle-on)"
                      : "var(--admin-toggle-off)",
                  }}
                  aria-label="Hiển thị"
                  aria-checked={form.isActive}
                  role="switch"
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm"
                    style={{
                      transform: form.isActive
                        ? "translateX(18px)"
                        : "translateX(2px)",
                    }}
                  />
                </button>
                <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Hiển thị
                </span>
              </div>
            </div>

            {/* Image section */}
            <div>
              <label className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
                Hình ảnh
              </label>

              {/* Local preview */}
              {localPreview && (
                <div
                  className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg"
                  style={{ border: "2px dashed var(--admin-primary)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localPreview}
                    alt="Ảnh xem trước"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="admin-focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
                    Sẽ được tải lên khi lưu
                  </div>
                </div>
              )}

              {/* Existing imageUrl */}
              {form.imageUrl && !localPreview && (
                <div
                  className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg"
                  style={{ border: "1px solid var(--admin-border-strong)" }}
                >
                  <Image
                    src={form.imageUrl}
                    alt={form.name || "Ảnh sản phẩm"}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="admin-focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}

              {/* File picker */}
              {!form.imageUrl && !localPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm transition-colors"
                  style={{
                    border: "2px dashed var(--admin-border-strong)",
                    color: "var(--admin-text-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-primary)";
                    (e.currentTarget as HTMLElement).style.color = "var(--admin-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border-strong)";
                    (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)";
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Chọn ảnh từ máy tính
                </button>
              )}

              {/* Replace image */}
              {form.imageUrl && !localPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs transition-colors"
                  style={{
                    border: "1px dashed var(--admin-border-strong)",
                    color: "var(--admin-text-subtle)",
                  }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Thay ảnh khác
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Error / Success banners */}
            {formError && (
              <p
                role="alert"
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  color: "var(--admin-danger)",
                  background: "var(--admin-danger-soft)",
                  border: "1px solid rgba(220,38,38,0.20)",
                }}
              >
                {formError}
              </p>
            )}
            {formSuccess && (
              <p
                role="status"
                aria-live="polite"
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  color: "var(--admin-success)",
                  background: "var(--admin-success-soft)",
                  border: "1px solid rgba(21,128,61,0.20)",
                }}
              >
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className={PRIMARY_BTN}
              style={{ background: "var(--admin-primary)" }}
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
            </button>
          </form>

          {/* Content block editor section */}
          <div
            className="mt-5 pt-5"
            style={{ borderTop: "1px solid var(--admin-border)" }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
              Nội dung sản phẩm
            </h3>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--admin-text-subtle)" }}>
              Tạo phần nội dung mở rộng hiển thị trên trang chi tiết sản phẩm.
            </p>
            {editing ? (
              <ContentBlockEditor
                productId={editing}
                initialBlocks={
                  products.find((p) => p.id === editing)?.contentBlocks ?? []
                }
                token={token!}
                onSaved={(updated) =>
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === updated.id
                        ? { ...p, contentBlocks: updated.contentBlocks }
                        : p,
                    ),
                  )
                }
              />
            ) : (
              <p
                className="text-xs py-3 text-center rounded-lg"
                style={{
                  color: "var(--admin-text-subtle)",
                  border: "1px dashed var(--admin-border)",
                }}
              >
                Vui lòng tạo sản phẩm trước, sau đó chỉnh nội dung mở rộng.
              </p>
            )}
          </div>

          {/* Product option assignment section */}
          <div
            className="mt-5 pt-5"
            style={{ borderTop: "1px solid var(--admin-border)" }}
          >
            {editing ? (
              <ProductOptionAssignments productId={editing} token={token!} />
            ) : (
              <>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
                  Tùy chọn áp dụng
                </h3>
                <p
                  className="text-xs py-3 text-center rounded-lg"
                  style={{
                    color: "var(--admin-text-subtle)",
                    border: "1px dashed var(--admin-border)",
                  }}
                >
                  Vui lòng tạo sản phẩm trước, sau đó gắn tùy chọn từ danh mục.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List panel */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>
            Sản phẩm ({products.length})
          </h2>
          <button
            onClick={loadProducts}
            className="admin-focus-ring rounded text-sm transition-colors hover:underline"
            style={{ color: "var(--admin-text-subtle)" }}
          >
            Làm mới
          </button>
        </div>

        {/* One shared surface for every state, matching the Option Catalog list -- keeps the
            panel's frame stable across loading/error/empty/populated instead of a stack of
            individually-bordered, individually-shadowed cards. */}
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
            <p
              role="alert"
              className="text-sm px-4 py-3"
              style={{ color: "var(--admin-danger)" }}
            >
              {listError}
            </p>
          )}

          {!listLoading && !listError && products.length === 0 && (
            <p className="text-sm py-12 text-center" style={{ color: "var(--admin-text-subtle)" }}>
              Chưa có sản phẩm nào. Tạo sản phẩm đầu tiên.
            </p>
          )}

          {!listLoading && !listError && products.map((p, idx) => {
            const isEditing = editing === p.id;
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid var(--admin-border)",
                  background: isEditing ? "var(--admin-primary-soft)" : "transparent",
                }}
              >
                {/* Thumbnail */}
                <div
                  className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg"
                  style={{ background: "var(--admin-surface-muted)" }}
                >
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ color: "var(--admin-border-strong)" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="h-6 w-6"
                      >
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 20M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate" style={{ color: "var(--admin-text)" }}>
                    {p.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>
                    {p.categoryName} ·{" "}
                    {p.basePrice > 0
                      ? `${p.basePrice.toLocaleString("vi-VN")} ₫`
                      : "Báo giá"}
                  </p>
                  <span
                    className={`mt-1 inline-block admin-badge ${
                      p.isActive ? "admin-badge-active" : "admin-badge-inactive"
                    }`}
                  >
                    {p.isActive ? "Hiển thị" : "Ẩn"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className={ICON_BTN_EDIT}
                    style={{
                      color: "var(--admin-primary)",
                      background: "var(--admin-primary-soft)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(8,51,125,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--admin-primary-soft)";
                    }}
                    aria-label={`Chỉnh sửa "${p.name}"`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Destructive action stays visually quiet at rest (same weight as a tertiary
                      control, like the Option Catalog's delete button) and only reads as
                      dangerous on hover/focus, so it doesn't compete with Edit as a persistent
                      red icon on every row. */}
                  <button
                    onClick={() => { setPendingDelete({ id: p.id, name: p.name }); setDeleteError(null); }}
                    className={`${ICON_BTN_DEL} hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]`}
                    style={{ color: "var(--admin-text-subtle)" }}
                    aria-label={`Xóa "${p.name}"`}
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
      <Modal open={pendingDelete !== null} onClose={closeDeleteModal} labelledBy="delete-product-title" maxWidthClassName="max-w-sm">
        {pendingDelete && (
          <div className="p-5">
            <h2 id="delete-product-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
              Xóa sản phẩm &ldquo;{pendingDelete.name}&rdquo;?
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
