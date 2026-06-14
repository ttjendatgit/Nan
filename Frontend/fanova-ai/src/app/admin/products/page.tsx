"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Upload,
  X,
  Pencil,
  Trash2,
  LogOut,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import {
  getProducts,
  createProductWithImage,
  updateProductWithImage,
  deleteProduct,
} from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
        setFormSuccess("Product updated.");
      } else {
        await createProductWithImage(fd, token);
        setFormSuccess("Product created.");
        startNew();
      }
      await loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!token) return;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id, token);
      await loadProducts();
      if (editing === id) startNew();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0D131F] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-[#111335] rounded-2xl p-8 border border-[#1B1C4A] space-y-5"
        >
          <div>
            <h1 className="text-xl font-semibold text-white">Admin Login</h1>
            <p className="text-xs text-[#B6D6F2]/60 mt-1">Products management</p>
          </div>
          {loginError && (
            <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
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
              className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/40 px-4 py-2.5 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/40 px-4 py-2.5 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-lg bg-[#273481] text-white py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
          <p className="text-xs text-[#B6D6F2]/40 text-center">
            manager@vifan.com / Manager@123
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D131F] text-white">
      <header className="bg-[#111335] border-b border-[#1B1C4A] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Admin</h1>
          <span className="text-[#273481]">/</span>
          <span className="text-sm text-[#B6D6F2]">Products</span>
          <a
            href="/admin/categories"
            className="ml-4 text-xs text-[#B6D6F2]/60 hover:text-[#B6D6F2] transition-colors"
          >
            → Categories
          </a>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[#B6D6F2]/60 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form panel */}
        <div className="lg:col-span-2">
          <div className="bg-[#111335] rounded-2xl border border-[#1B1C4A] p-6 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {editing ? "Edit Product" : "New Product"}
              </h2>
              {editing && (
                <button
                  onClick={startNew}
                  className="text-xs text-[#B6D6F2] hover:text-white transition-colors"
                >
                  + New
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Category */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="Quạt giấy in logo"
                  className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="quat-giay-in-logo"
                  className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Mô tả sản phẩm..."
                  className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors resize-none"
                />
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                    Base Price (VND) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, basePrice: e.target.value }))
                    }
                    required
                    placeholder="150000"
                    className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                    Min Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.minQuantity}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, minQuantity: e.target.value }))
                    }
                    className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                  />
                </div>
              </div>

              {/* Production days */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Est. Production Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.estimatedProductionDays}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estimatedProductionDays: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors"
                />
              </div>

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
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.isCustomizable
                        ? "bg-[#273481]"
                        : "bg-[#1B1C4A] border border-[#273481]"
                    }`}
                    aria-label="Toggle customizable"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        form.isCustomizable ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-[#B6D6F2]">Customizable</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.isActive
                        ? "bg-[#273481]"
                        : "bg-[#1B1C4A] border border-[#273481]"
                    }`}
                    aria-label="Toggle active"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-[#B6D6F2]">Active</span>
                </div>
              </div>

              {/* Image section */}
              <div>
                <label className="block text-xs text-[#B6D6F2]/70 mb-1.5">
                  Image
                </label>

                {/* Local preview (selected, will upload on save) */}
                {localPreview && (
                  <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-dashed border-[#273481]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={localPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-[#B6D6F2]">
                      Will be uploaded on save
                    </div>
                  </div>
                )}

                {/* Existing imageUrl (no new file selected) */}
                {form.imageUrl && !localPreview && (
                  <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-[#273481]">
                    <Image
                      src={form.imageUrl}
                      alt="Current image"
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                )}

                {/* File picker (no image set yet) */}
                {!form.imageUrl && !localPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#273481] py-3 text-sm text-[#B6D6F2]/70 hover:border-[#B6D6F2] hover:text-white transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Select image from computer
                  </button>
                )}

                {/* Replace image button (existing image, no local file yet) */}
                {form.imageUrl && !localPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#273481] py-2 text-xs text-[#B6D6F2]/70 hover:border-[#B6D6F2] hover:text-white transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Replace image
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

              {formError && (
                <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-sm text-green-400 bg-green-900/20 rounded-lg px-3 py-2">
                  {formSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#273481] py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Update Product" : "Create Product"}
              </button>
            </form>
          </div>
        </div>

        {/* List panel */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">
              Products ({products.length})
            </h2>
            <button
              onClick={loadProducts}
              className="text-sm text-[#B6D6F2]/60 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>

          {listLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#B6D6F2]" />
            </div>
          )}

          {listError && (
            <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-4 py-3">
              {listError}
            </p>
          )}

          {!listLoading && products.length === 0 && !listError && (
            <p className="text-sm text-[#B6D6F2]/40 py-12 text-center">
              No products yet. Create your first one.
            </p>
          )}

          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                  editing === p.id
                    ? "border-[#273481] bg-[#1B1C4A]"
                    : "border-[#1B1C4A] bg-[#111335]"
                }`}
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#1B1C4A]">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#273481]/60">
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

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-[#B6D6F2]/50 truncate">
                    {p.categoryName} · {p.basePrice > 0 ? `${p.basePrice.toLocaleString("vi-VN")} ₫` : "Báo giá"}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.isActive
                        ? "bg-green-900/30 text-green-400"
                        : "bg-[#273481]/20 text-[#B6D6F2]/50"
                    }`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg bg-[#273481]/30 p-2 text-[#B6D6F2] hover:bg-[#273481] hover:text-white transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="rounded-lg bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
