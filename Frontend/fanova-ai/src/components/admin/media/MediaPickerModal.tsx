"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getMediaAssets } from "@/lib/api/media";
import type { MediaAsset } from "@/types/media";

const PAGE_SIZE = 20;

interface Pagination {
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  /** Single-select mode (the default): clicking an asset calls this immediately and closes the
   * modal. Ignored when `multiple` is true. */
  onSelect?: (asset: MediaAsset) => void;
  /** Multi-select mode, added Phase 2.2 for GalleryBlockEditor. Clicking toggles a checkmark
   * instead of closing; a footer bar confirms the whole selection at once via this callback.
   * `onSelect` is not used in this mode. */
  multiple?: boolean;
  onSelectMultiple?: (assets: MediaAsset[]) => void;
}

/**
 * Shared image picker: search + paginated grid over the Media Library (GET /api/Media). Reused
 * by ImageBlockEditor (single-select) and GalleryBlockEditor (multi-select, Phase 2.2); written
 * generically enough (token-driven, no Content Studio knowledge) that wiring it into another
 * image field later (e.g. SeoPanel's SEO Image URL) is a drop-in, not a rewrite.
 */
export default function MediaPickerModal({ open, onClose, onSelect, multiple = false, onSelectMultiple, token }: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  // Keyed by asset id, not object identity -- assets are refetched on every page change, so an
  // object-identity Set would lose selection the moment the admin turns a page. Kept as a Map
  // (id -> MediaAsset) rather than a Set<string> so the confirm button can hand back full
  // MediaAsset objects without re-fetching or re-deriving them from ids.
  const [selected, setSelected] = useState<Map<string, MediaAsset>>(new Map());

  // Fresh state every time the picker opens -- a stale search/page/error/selection from the last
  // time it was open would be confusing, not helpful.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setSelected(new Map());
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open, debouncedSearch]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getMediaAssets(
        { search: debouncedSearch || undefined, pageNumber: page, pageSize: PAGE_SIZE },
        token,
      );
      setAssets(result.items);
      setPagination({
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thư viện media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, debouncedSearch]);

  const titleId = "media-picker-title";
  const isFiltered = debouncedSearch.trim().length > 0;

  function toggleSelect(asset: MediaAsset) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.set(asset.id, asset);
      return next;
    });
  }

  function handleConfirmSelection() {
    if (selected.size === 0) return;
    onSelectMultiple?.(Array.from(selected.values()));
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} maxWidthClassName="max-w-2xl">
      <div className="p-5">
        <h2 id={titleId} className="mb-4 text-base font-semibold" style={{ color: "var(--admin-text)" }}>
          {multiple ? "Chọn hình ảnh (có thể chọn nhiều)" : "Chọn hình ảnh"}
        </h2>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-subtle)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tệp..."
            aria-label="Tìm kiếm hình ảnh"
            className="admin-input pl-8"
          />
        </div>

        {loading && (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg admin-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="flex items-start gap-3 rounded-lg p-4" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
            <div className="flex-1">
              <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{error}</p>
              <button onClick={load} className="admin-focus-ring mt-1.5 rounded text-xs font-medium underline underline-offset-2" style={{ color: "var(--admin-danger)" }}>
                Thử lại
              </button>
            </div>
          </div>
        )}

        {!loading && !error && assets.length === 0 && (
          <div className="py-10 text-center">
            <ImageIcon className="mx-auto h-8 w-8" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
              {isFiltered ? "Không tìm thấy hình ảnh phù hợp." : "Thư viện chưa có hình ảnh nào."}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
              {isFiltered ? "Thử từ khóa khác." : "Tải hình ảnh lên tại Thư viện Media trước."}
            </p>
          </div>
        )}

        {!loading && !error && assets.length > 0 && (
          <div className="grid max-h-[50vh] grid-cols-3 gap-2.5 overflow-y-auto py-1 sm:grid-cols-4" role="list" aria-label="Danh sách hình ảnh">
            {assets.map((asset) => {
              const isSelected = multiple && selected.has(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  role="listitem"
                  onClick={() => (multiple ? toggleSelect(asset) : onSelect?.(asset))}
                  aria-pressed={multiple ? isSelected : undefined}
                  className="admin-focus-ring group relative aspect-square overflow-hidden rounded-lg transition-colors"
                  style={{ border: isSelected ? "2px solid var(--admin-primary)" : "1px solid var(--admin-border)" }}
                  aria-label={multiple ? `${isSelected ? "Bỏ chọn" : "Chọn"} "${asset.originalName}"` : `Chọn "${asset.originalName}"`}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-primary)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border)"; }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.originalName} className="h-full w-full object-cover" />
                  <span
                    className="absolute inset-x-0 bottom-0 truncate px-1.5 py-1 text-left text-[10px]"
                    style={{ background: "rgba(8,20,38,0.65)", color: "#FFFFFF" }}
                  >
                    {asset.originalName}
                  </span>
                  {isSelected && (
                    <span
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: "var(--admin-primary)", color: "#FFFFFF" }}
                      aria-hidden="true"
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
              Trang {page} / {pagination.totalPages} &middot; {pagination.totalCount} tệp
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                aria-label="Trang trước"
                className="admin-focus-ring flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
              >
                <ChevronLeft size={13} /> Trước
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage || loading}
                aria-label="Trang tiếp"
                className="admin-focus-ring flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
              >
                Tiếp <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {multiple && (
          <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>
              {selected.size > 0 ? `Đã chọn ${selected.size} ảnh` : "Chưa chọn ảnh nào"}
            </p>
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={selected.size === 0}
              className="admin-focus-ring rounded-lg px-4 py-2 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--admin-primary)" }}
            >
              Thêm {selected.size > 0 ? selected.size : ""} ảnh
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
