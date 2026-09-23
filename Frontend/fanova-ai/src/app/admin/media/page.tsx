"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import { uploadMedia } from "@/lib/api/media";
import { getMediaAssets, deleteMediaAsset } from "@/lib/api/media";
import { formatFileSize } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import type { MediaAsset } from "@/types/media";

const PAGE_SIZE = 24;
const PRIMARY_BTN =
  "admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteAssetModal({
  asset, busy, error, onCancel, onConfirm,
}: {
  asset: MediaAsset | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={asset !== null} onClose={() => { if (!busy) onCancel(); }} labelledBy="delete-asset-title" maxWidthClassName="max-w-sm">
      {asset && (
        <div className="p-5">
          <h2 id="delete-asset-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
            Xóa &ldquo;{asset.originalName}&rdquo;?
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--admin-text-muted)" }}>
            Đây là <span className="font-medium" style={{ color: "var(--admin-danger)" }}>hành động xóa vĩnh viễn</span> khỏi
            thư viện và Cloudinary, không có bước khôi phục. Nếu tệp này đang được dùng trong một nội dung khác, đường dẫn đó sẽ không còn tải được ảnh nữa.
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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
          <div className="aspect-square admin-skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded admin-skeleton" />
            <div className="h-2.5 w-1/2 rounded admin-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl p-4" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
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
    <div className="rounded-xl px-4 py-16 text-center" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
      <ImageIcon className="mx-auto h-9 w-9" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
        {filtered ? "Không tìm thấy tệp phù hợp." : "Chưa có tệp nào được tải lên."}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--admin-text-subtle)" }}>
        {filtered ? "Thử từ khóa khác." : "Nhấn \"Tải lên\" để thêm hình ảnh đầu tiên vào thư viện."}
      </p>
    </div>
  );
}

// ─── Asset card ─────────────────────────────────────────────────────────────────

function AssetCard({
  asset, copied, onCopy, onDeleteClick,
}: {
  asset: MediaAsset;
  copied: boolean;
  onCopy: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl transition-colors" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
      <div className="aspect-square" style={{ background: "var(--admin-surface-muted)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.originalName} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium" title={asset.originalName} style={{ color: "var(--admin-text)" }}>
          {asset.originalName}
        </p>
        <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>
          {formatFileSize(asset.size)}
          {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
        </p>
        <p className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>{formatDate(asset.createdAt)}</p>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className="admin-focus-ring flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border text-[11px] font-medium transition-colors"
            style={{ borderColor: "var(--admin-border-strong)", color: copied ? "var(--admin-success)" : "var(--admin-text-muted)" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Đã chép" : "Sao chép URL"}
          </button>
          <button
            type="button"
            onClick={onDeleteClick}
            className="admin-focus-ring flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border text-[11px] transition-colors hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
          >
            <Trash2 size={13} /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminMediaPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; totalCount: number; hasPreviousPage: boolean; hasNextPage: boolean } | null>(null);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function loadAssets(tk: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getMediaAssets({ search: debouncedSearch || undefined, pageNumber: page, pageSize: PAGE_SIZE }, tk);
      setAssets(result.items);
      setPagination({
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải thư viện media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => { loadAssets(token); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, debouncedSearch]);

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

  async function handleFilesSelected(fileList: FileList | null) {
    if (!token || !fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    setNotice(null);
    let succeeded = 0;
    let firstError: string | null = null;

    for (const file of files) {
      try {
        await uploadMedia(file, "content", token);
        succeeded++;
      } catch (err) {
        firstError = err instanceof Error ? err.message : "Tải lên thất bại.";
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (succeeded > 0) {
      setNotice({
        type: firstError ? "error" : "success",
        text: firstError
          ? `Đã tải lên ${succeeded}/${files.length} tệp. Lỗi: ${firstError}`
          : `Đã tải lên ${succeeded} tệp thành công.`,
      });
      setPage(1);
      await loadAssets(token);
    } else {
      setNotice({ type: "error", text: firstError ?? "Không thể tải lên. Vui lòng thử lại." });
    }
  }

  async function handleCopy(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      window.setTimeout(() => setCopiedId((current) => (current === asset.id ? null : current)), 1500);
    } catch {
      setNotice({ type: "error", text: "Không thể sao chép URL. Vui lòng sao chép thủ công." });
    }
  }

  async function handleDelete() {
    if (!token || !pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteMediaAsset(pendingDelete.id, token);
      const name = pendingDelete.originalName;
      setPendingDelete(null);
      setNotice({ type: "success", text: `Đã xóa "${name}".` });
      await loadAssets(token);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Không thể xóa tệp. Vui lòng thử lại.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  const isFiltered = debouncedSearch.trim().length > 0;

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: "var(--admin-canvas)" }}>
        <div className="w-full max-w-[340px]">
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Thư viện Media</p>
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
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>Thư viện Media</h1>
          <p className="mt-1 text-sm max-w-[60ch]" style={{ color: "var(--admin-text-subtle)" }}>
            Hình ảnh dùng chung cho nội dung, SEO và (trong tương lai) sản phẩm.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${PRIMARY_BTN} shrink-0`}
            style={{ background: "var(--admin-primary)" }}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {uploading ? "Đang tải lên..." : "Tải lên"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5 rounded-xl p-3" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
        <div className="relative w-full sm:max-w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tệp..."
            aria-label="Tìm kiếm trong thư viện media"
            className="admin-input"
          />
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-xs"
          style={{
            border: notice.type === "success" ? "1px solid rgba(21,128,61,0.22)" : "1px solid rgba(220,38,38,0.22)",
            background: notice.type === "success" ? "var(--admin-success-soft)" : "var(--admin-danger-soft)",
            color: notice.type === "success" ? "var(--admin-success)" : "var(--admin-danger)",
          }}>
          {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <p className="flex-1">{notice.text}</p>
          <button onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="admin-focus-ring shrink-0 rounded" style={{ color: "inherit" }}><X size={12} /></button>
        </div>
      )}

      {/* Grid / states */}
      {loading && <GridSkeleton />}
      {!loading && loadError && <ErrorBanner message={loadError} onRetry={() => token && loadAssets(token)} />}
      {!loading && !loadError && assets.length === 0 && <EmptyState filtered={isFiltered} />}
      {!loading && !loadError && assets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              copied={copiedId === asset.id}
              onCopy={() => handleCopy(asset)}
              onDeleteClick={() => { setPendingDelete(asset); setDeleteError(null); }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
            Trang {page} / {pagination.totalPages} &middot; {pagination.totalCount} tệp
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage || loading}
              aria-label="Trang trước"
              className="admin-focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage || loading}
              aria-label="Trang tiếp"
              className="admin-focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteAssetModal
        asset={pendingDelete}
        busy={deleteBusy}
        error={deleteError}
        onCancel={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
}
