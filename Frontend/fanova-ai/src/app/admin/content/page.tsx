"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import { getProducts } from "@/lib/api/products";
import { deleteContentDocument, getContentDocuments } from "@/lib/api/contentDocuments";
import { CONTENT_TYPE_VALUES, contentTypeLabel } from "@/lib/contentLabels";
import ContentStatusBadge from "@/components/admin/content/ContentStatusBadge";
import Modal from "@/components/ui/Modal";
import type { Product } from "@/types/catalog";
import type { ContentDocument } from "@/types/content";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const PRIMARY_BTN =
  "admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteDocumentModal({
  document, busy, error, onCancel, onConfirm,
}: {
  document: ContentDocument | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={document !== null} onClose={() => { if (!busy) onCancel(); }} labelledBy="delete-document-title" maxWidthClassName="max-w-sm">
      {document && (
        <div className="p-5">
          <h2 id="delete-document-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
            Xóa &ldquo;{document.title}&rdquo;?
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--admin-text-muted)" }}>
            Đây là <span className="font-medium" style={{ color: "var(--admin-danger)" }}>hành động xóa vĩnh viễn</span>, không có bước khôi phục.
            {document.status !== "Archived" && (
              <> Nếu chỉ muốn tạm ẩn nội dung này, hãy đổi <span className="font-medium" style={{ color: "var(--admin-text)" }}>Trạng thái</span> sang &ldquo;Đã lưu trữ&rdquo; thay vì xóa.</>
            )}
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-danger)" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--admin-danger)" }}>{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={onConfirm} disabled={busy}
              className="admin-focus-ring flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
              style={{ borderColor: "rgba(220,38,38,0.30)", background: "var(--admin-danger-soft)", color: "var(--admin-danger)" }}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Xóa vĩnh viễn
            </button>
            <button type="button" onClick={onCancel} disabled={busy}
              className="admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition disabled:opacity-50"
              style={{ color: "var(--admin-text-subtle)" }}>
              Hủy
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Skeletons / empty / error ─────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 rounded admin-skeleton" style={{ width: `${55 + ((i + j) % 3) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 space-y-2.5" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
          <div className="h-4 w-2/3 rounded admin-skeleton" />
          <div className="h-3 w-1/2 rounded admin-skeleton" />
          <div className="h-3 w-1/3 rounded admin-skeleton" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 p-4">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
      <div className="flex-1">
        <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{message}</p>
        <button onClick={onRetry} className="admin-focus-ring mt-1.5 rounded text-xs font-medium underline underline-offset-2" style={{ color: "var(--admin-danger)" }}>
          Thử lại
        </button>
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-4 py-12 text-center">
      <Newspaper className="mx-auto h-8 w-8" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
        {filtered ? "Không tìm thấy nội dung phù hợp." : "Chưa có nội dung nào."}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--admin-text-subtle)" }}>
        {filtered ? "Thử chọn loại nội dung khác." : "Nhấn \"Thêm nội dung\" để tạo trang, bài viết hoặc nội dung sản phẩm đầu tiên."}
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminContentPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<ContentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; totalCount: number; hasPreviousPage: boolean; hasNextPage: boolean } | null>(null);

  const [listNotice, setListNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [pendingDelete, setPendingDelete] = useState<ContentDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadProducts(tk: string) {
    try {
      const result = await getProducts({ pageSize: 100, activeOnly: false }, tk);
      setProducts(result.items);
    } catch {
      // Non-fatal: the product-name lookup degrades to "—"; the list/table itself doesn't depend on this.
    }
  }

  async function loadDocuments(tk: string, pageNum: number, type: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getContentDocuments({ type: type || undefined, pageNumber: pageNum, pageSize: PAGE_SIZE }, tk);
      setDocuments(result.items);
      setPagination({
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải danh sách nội dung.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => { loadProducts(token); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => { loadDocuments(token, page, typeFilter); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, typeFilter]);

  const productNameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  const isFiltered = typeFilter !== "";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login(loginEmail, loginPassword);
      setToken(res.accessToken);
      sessionStorage.setItem("nan_admin_token", res.accessToken);
      window.location.reload();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleTypeFilterChange(next: string) {
    setTypeFilter(next);
    setPage(1);
  }

  async function handleDelete() {
    if (!token || !pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteContentDocument(pendingDelete.id, token);
      const title = pendingDelete.title;
      setPendingDelete(null);
      setListNotice({ type: "success", text: `Đã xóa "${title}".` });
      await loadDocuments(token, page, typeFilter);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Không thể xóa nội dung. Vui lòng thử lại.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: "var(--admin-canvas)" }}>
        <div className="w-full max-w-[340px]">
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Nội dung</p>
          <p className="mb-6 text-[12px]" style={{ color: "var(--admin-text-subtle)" }}>Vui lòng đăng nhập để tiếp tục.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" className="admin-input" required />
            <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" className="admin-input" required />
            {loginError && (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loginLoading} className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "var(--admin-primary)" }}>
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" style={{ color: "var(--admin-text)" }}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>Nội dung</h1>
          <p className="mt-1 text-sm max-w-[60ch]" style={{ color: "var(--admin-text-subtle)" }}>
            Quản lý nội dung mở rộng cho sản phẩm, trang tĩnh và bài viết blog.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className={`${PRIMARY_BTN} shrink-0`}
          style={{ background: "var(--admin-primary)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Thêm nội dung
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo loại nội dung">
          {[{ value: "", label: "Tất cả" }, ...CONTENT_TYPE_VALUES.map((t) => ({ value: t, label: contentTypeLabel(t) }))].map((opt) => (
            <button
              key={opt.value || "all"}
              onClick={() => handleTypeFilterChange(opt.value)}
              aria-pressed={typeFilter === opt.value}
              className="admin-focus-ring rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.10em] transition-colors"
              style={
                typeFilter === opt.value
                  ? { borderColor: "var(--admin-primary)", background: "var(--admin-primary-soft)", color: "var(--admin-primary)" }
                  : { borderColor: "var(--admin-border-strong)", background: "transparent", color: "var(--admin-text-subtle)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List notice */}
      {listNotice && (
        <div role="status" aria-live="polite" className="mb-4 flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-xs"
          style={{
            border: listNotice.type === "success" ? "1px solid rgba(21,128,61,0.22)" : "1px solid rgba(220,38,38,0.22)",
            background: listNotice.type === "success" ? "var(--admin-success-soft)" : "var(--admin-danger-soft)",
            color: listNotice.type === "success" ? "var(--admin-success)" : "var(--admin-danger)",
          }}>
          {listNotice.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <p className="flex-1">{listNotice.text}</p>
          <button onClick={() => setListNotice(null)} aria-label="Đóng thông báo" className="admin-focus-ring shrink-0 rounded" style={{ color: "inherit" }}><X size={12} /></button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl sm:block" style={{ border: "1px solid var(--admin-border)" }}>
        <table className="w-full min-w-[720px] text-left" style={{ background: "var(--admin-surface)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}>
              {["Tiêu đề", "Loại", "Trạng thái", "Cập nhật", ""].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeleton />}
            {!loading && loadError && <tr><td colSpan={5}><ErrorBanner message={loadError} onRetry={() => token && loadDocuments(token, page, typeFilter)} /></td></tr>}
            {!loading && !loadError && documents.length === 0 && (
              <tr><td colSpan={5}><EmptyState filtered={isFiltered} /></td></tr>
            )}
            {!loading && !loadError && documents.map((d) => (
              <tr key={d.id} className="transition-colors" style={{ borderBottom: "1px solid var(--admin-border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-primary-soft)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                <td className="px-4 py-3.5 max-w-[260px]">
                  <p className="truncate text-[13px] font-medium" style={{ color: "var(--admin-text)" }}>{d.title}</p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
                    {d.type === "ProductContent" ? (productNameById.get(d.productId ?? "") ?? "—") : `/${d.slug}`}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-[12px]" style={{ color: "var(--admin-text-muted)" }}>{contentTypeLabel(d.type)}</td>
                <td className="px-4 py-3.5"><ContentStatusBadge status={d.status} /></td>
                <td className="px-4 py-3.5 font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{formatDate(d.updatedAt)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/content/${d.id}`}
                      className="admin-focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
                      aria-label={`Sửa "${d.title}"`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button onClick={() => { setPendingDelete(d); setDeleteError(null); }}
                      className="admin-focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
                      style={{ color: "var(--admin-text-subtle)" }}
                      aria-label={`Xóa "${d.title}"`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden">
        {loading && <CardSkeleton />}
        {!loading && loadError && <div className="rounded-xl" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}><ErrorBanner message={loadError} onRetry={() => token && loadDocuments(token, page, typeFilter)} /></div>}
        {!loading && !loadError && documents.length === 0 && (
          <div className="rounded-xl" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
            <EmptyState filtered={isFiltered} />
          </div>
        )}
        {!loading && !loadError && documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((d) => (
              <div key={d.id} className="rounded-xl p-4" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>{d.title}</p>
                    <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
                      {contentTypeLabel(d.type)} &middot; {d.type === "ProductContent" ? (productNameById.get(d.productId ?? "") ?? "—") : `/${d.slug}`}
                    </p>
                  </div>
                  <ContentStatusBadge status={d.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>Cập nhật {formatDate(d.updatedAt)}</span>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-1.5">
                  <Link href={`/admin/content/${d.id}`}
                    className="admin-focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}>
                    <Pencil size={13} /> Sửa
                  </Link>
                  <button onClick={() => { setPendingDelete(d); setDeleteError(null); }}
                    className="admin-focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border text-[12px] transition-colors"
                    style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}>
                    <Trash2 size={13} /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
            Trang {page} / {pagination.totalPages} &middot; {pagination.totalCount} mục
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage || loading}
              aria-label="Trang trước"
              className="admin-focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
            >
              <ChevronLeft size={13} /> Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage || loading}
              aria-label="Trang tiếp"
              className="admin-focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
            >
              Tiếp <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Refresh */}
      {!loading && !loadError && (
        <div className="mt-6 flex justify-end">
          <button onClick={() => token && loadDocuments(token, page, typeFilter)} className="admin-focus-ring rounded text-sm transition-colors hover:underline" style={{ color: "var(--admin-text-subtle)" }}>
            Làm mới
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteDocumentModal
        document={pendingDelete}
        busy={deleteBusy}
        error={deleteError}
        onCancel={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
}
