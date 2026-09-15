"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import {
  getQuoteRequests,
  setFinalQuotedPrice,
  updateQuoteRequestStatus,
} from "@/lib/api/quoteRequests";
import { formatVnd } from "@/lib/format";
import { optionTypeLabel } from "@/lib/optionTypes";
import type { QuoteRequestDto, QuoteRequestStatus, QuoteStatusNotificationOutcome } from "@/types/quote";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: QuoteRequestStatus | "all"; label: string }[] = [
  { value: "all",       label: "Tất cả"     },
  { value: "New",       label: "Mới"         },
  { value: "Contacted", label: "Đã liên hệ" },
  { value: "Quoted",    label: "Đã báo giá" },
  { value: "Closed",    label: "Đã chốt"    },
  { value: "Cancelled", label: "Đã hủy"     },
];

const STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  New:       "Mới",
  Contacted: "Đã liên hệ",
  Quoted:    "Đã báo giá",
  Closed:    "Đã chốt",
  Cancelled: "Đã hủy",
};

// Shared admin-badge-* classes (globals.css) — same status-color language as
// the rest of the admin instead of a page-local Tailwind palette.
const STATUS_BADGE_CLS: Record<QuoteRequestStatus, string> = {
  New:       "admin-badge-new",
  Contacted: "admin-badge-contact",
  Quoted:    "admin-badge-quoted",
  Closed:    "admin-badge-closed",
  Cancelled: "admin-badge-cancelled",
};

// Summary card accent colors for count numbers
const STATUS_ACCENT: Record<string, string> = {
  total:     "text-[#081426]",
  newCount:  "text-blue-700",
  contacted: "text-amber-700",
  quoted:    "text-indigo-700",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return iso; }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function dash(val?: string | null): string {
  return val?.trim() || "—";
}

// Backend is the sole authority on whether/why a status-change email was (or wasn't) sent --
// this only translates its explicit outcome into the copy Staff sees, it never re-derives the
// outcome from `status` itself.
function notificationOutcomeToNotice(
  outcome: QuoteStatusNotificationOutcome,
): { tone: "success" | "warning"; text: string } {
  switch (outcome) {
    case "Sent":
      return { tone: "success", text: "Đã cập nhật trạng thái. Đã gửi email thông báo tới địa chỉ khách hàng đã cung cấp." };
    case "SkippedNoEmail":
      return { tone: "warning", text: "Đã cập nhật trạng thái. Khách hàng chưa có email nên không thể gửi thông báo." };
    case "Failed":
      return { tone: "warning", text: "Đã cập nhật trạng thái, nhưng chưa gửi được email thông báo." };
    case "NotRequired":
    default:
      return { tone: "success", text: "Đã cập nhật trạng thái." };
  }
}

// ─── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  const cls = STATUS_BADGE_CLS[status] ?? STATUS_BADGE_CLS.New;
  return (
    <span className={`admin-badge ${cls} font-mono uppercase tracking-[0.10em]`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── PriceCell — list-row price readout ─────────────────────────────────────
// Deliberately never shows the same value twice: a finalized quote shows only
// the commercial FinalQuotedPrice (bold, "Đã chốt"); anything else falls back
// to the system-calculated snapshot, visibly softer and labeled "Dự kiến" so
// staff never mistake a calculated estimate for a confirmed commercial price.
function PriceCell({ quote }: { quote: QuoteRequestDto }) {
  if (quote.finalQuotedPrice != null) {
    return (
      <div>
        <p className="font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: "var(--admin-primary)" }}>
          {formatVnd(quote.finalQuotedPrice)}
        </p>
        <p className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>Đã chốt</p>
      </div>
    );
  }
  if (quote.calculatedTotalSnapshot != null) {
    return (
      <div>
        <p className="font-mono text-[12px] tabular-nums" style={{ color: "var(--admin-text-muted)" }}>
          {formatVnd(quote.calculatedTotalSnapshot)}
        </p>
        <p className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>Dự kiến</p>
      </div>
    );
  }
  return <span style={{ color: "var(--admin-text-subtle)" }}>—</span>;
}

// ─── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accentCls }: { label: string; value: number | null; accentCls: string }) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", boxShadow: "0 1px 3px rgba(8,51,125,0.05)" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${accentCls}`}>
        {value === null ? (
          <span className="inline-block h-6 w-10 rounded admin-skeleton" />
        ) : value}
      </p>
    </div>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded admin-skeleton" style={{ width: `${60 + ((i + j) % 3) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 space-y-2.5" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
          <div className="h-4 w-2/3 rounded admin-skeleton" />
          <div className="h-3 w-1/2 rounded admin-skeleton" />
          <div className="flex justify-between">
            <div className="h-3 w-1/3 rounded admin-skeleton" />
            <div className="h-5 w-20 rounded-full admin-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileText className="h-10 w-10" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
      <p className="mt-4 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
        {filtered ? "Không tìm thấy yêu cầu phù hợp." : "Chưa có yêu cầu báo giá nào."}
      </p>
      <p className="mt-1.5 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
        {filtered ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." : "Khi khách hàng gửi yêu cầu từ website, chúng sẽ xuất hiện ở đây."}
      </p>
    </div>
  );
}

// ─── ErrorBanner ───────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="mx-4 my-6 flex items-start gap-3 rounded-xl px-4 py-3.5"
      style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
      <div className="flex-1">
        <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="admin-focus-ring shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors"
        style={{ borderColor: "rgba(220,38,38,0.25)", color: "var(--admin-danger)" }}
      >
        Thử lại
      </button>
    </div>
  );
}

// ─── AdminLoginForm ─────────────────────────────────────────────────────────────

function AdminLoginForm({
  email, password, loading, error,
  setEmail, setPassword, onSubmit,
}: {
  email: string; password: string; loading: boolean; error: string | null;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: "var(--admin-canvas)" }}>
      <div className="w-full max-w-[340px]">
        <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Yêu cầu báo giá</p>
        <p className="mb-6 text-[12px]" style={{ color: "var(--admin-text-subtle)" }}>Vui lòng đăng nhập để tiếp tục.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="admin-input" required />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="admin-input" required />
          {error && (
            <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--admin-primary)" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── PricingBreakdownSection ───────────────────────────────────────────────────

function PricingBreakdownSection({ quote }: { quote: QuoteRequestDto }) {
  return (
    <section>
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>
        Cấu hình đã chọn
      </p>
      {quote.options.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>Không có tùy chọn nào được chọn.</p>
      ) : (
        <div className="space-y-3">
          {/* Snapshot data -- never re-fetched from the live Option Catalog, so this always
              reflects exactly what the customer saw and selected at submission time, even if
              that option was later renamed, repriced, or deactivated in the catalog. */}
          {quote.options.map((opt) => (
            <div key={opt.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.08em]" style={{ color: "var(--admin-text-subtle)" }}>
                  {optionTypeLabel(opt.optionTypeSnapshot)}
                </p>
                <p className="text-sm" style={{ color: "var(--admin-text)" }}>{opt.optionValueSnapshot}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm tabular-nums" style={{ color: opt.calculatedAmountSnapshot > 0 ? "var(--admin-text)" : "var(--admin-text-subtle)" }}>
                  {opt.calculatedAmountSnapshot > 0 ? `+${formatVnd(opt.calculatedAmountSnapshot)}` : "Không cộng thêm"}
                </p>
                {opt.calculatedAmountSnapshot > 0 && (
                  <p className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>
                    {formatVnd(opt.priceAdjustmentSnapshot)}{opt.priceAdjustmentTypeSnapshot === "FixedPerOrder" ? "/đơn" : "/cái"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mb-1.5 mt-5 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>
        Giá hệ thống tính toán
      </p>
      <p className="mb-3 text-[11px] leading-snug" style={{ color: "var(--admin-text-subtle)" }}>
        Số liệu cố định tại thời điểm gửi yêu cầu, không đổi theo giá hiện tại trong danh mục.
      </p>
      <div className="space-y-2 text-sm">
        <PricingRow label="Giá gốc / cái"                 value={formatVnd(quote.baseUnitPriceSnapshot)} />
        <PricingRow label="Giá đã cộng option / cái"       value={formatVnd(quote.calculatedUnitPriceSnapshot)} />
        <PricingRow label="Tạm tính"                       value={formatVnd(quote.calculatedSubtotalSnapshot)} />
        <PricingRow label="Phí thêm (per-order)"           value={formatVnd(quote.additionalFeesSnapshot)} />
        <PricingRow label="Giảm giá"                       value={formatVnd(quote.discountAmountSnapshot)} />
        <PricingRow label="Tổng tính toán"                 value={formatVnd(quote.calculatedTotalSnapshot)} emphasis />
      </div>
    </section>
  );
}

function PricingRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`flex items-center justify-between pt-2 ${emphasis ? "pt-2.5" : ""}`} style={{ borderTop: "1px solid var(--admin-border)" }}>
      <span style={{ color: "var(--admin-text-subtle)" }}>{label}</span>
      <span className={emphasis ? "text-base font-semibold" : ""} style={{ color: "var(--admin-text)" }}>{value}</span>
    </div>
  );
}

// ─── FinalPriceSection ─────────────────────────────────────────────────────────

function FinalPriceSection({
  quote, token, onSaved,
}: {
  quote: QuoteRequestDto;
  token: string;
  onSaved: (updated: QuoteRequestDto) => void;
}) {
  const [finalPrice, setFinalPrice] = useState(String(quote.finalQuotedPrice ?? quote.calculatedTotalSnapshot ?? ""));
  const [manualAdjustment, setManualAdjustment] = useState(String(quote.manualAdjustment ?? ""));
  const [internalNote, setInternalNote] = useState(quote.internalNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setFinalPrice(String(quote.finalQuotedPrice ?? quote.calculatedTotalSnapshot ?? ""));
    setManualAdjustment(String(quote.manualAdjustment ?? ""));
    setInternalNote(quote.internalNote ?? "");
    setSaved(false);
  }, [quote.id, quote.finalQuotedPrice, quote.manualAdjustment, quote.internalNote, quote.calculatedTotalSnapshot]);

  async function handleSave() {
    const priceNum = parseFloat(finalPrice);
    if (isNaN(priceNum) || priceNum < 0) { setSaveError("Giá cuối phải là số hợp lệ."); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await setFinalQuotedPrice(quote.id, {
        finalQuotedPrice: priceNum,
        manualAdjustment: manualAdjustment.trim() ? parseFloat(manualAdjustment) : undefined,
        internalNote: internalNote.trim() || undefined,
      }, token);
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  const isFinalized = quote.finalQuotedPrice != null;

  return (
    <section>
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>
        Giá báo & ghi chú nội bộ
      </p>

      {/* Commercially prominent readout of the SAVED final price -- reads from `quote`, not the
          in-progress `finalPrice` input state, so it never implies an unsaved keystroke is
          already the official quote. Distinct styling (filled navy vs. muted paper) is the only
          thing separating "confirmed" from "still just a system estimate" at a glance. */}
      <div
        className="mb-4 rounded-xl px-4 py-3.5"
        style={{
          background: isFinalized ? "var(--admin-primary-soft)" : "var(--admin-surface-muted)",
          border: `1px solid ${isFinalized ? "var(--admin-primary)" : "var(--admin-border)"}`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Giá báo cuối cùng</p>
          <span className={`admin-badge ${isFinalized ? "admin-badge-closed" : "admin-badge-inactive"} font-mono uppercase tracking-[0.10em]`}>
            {isFinalized ? "Đã chốt" : "Chưa chốt"}
          </span>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: isFinalized ? "var(--admin-primary)" : "var(--admin-text-subtle)" }}>
          {isFinalized
            ? formatVnd(quote.finalQuotedPrice)
            : quote.calculatedTotalSnapshot != null
              ? `~ ${formatVnd(quote.calculatedTotalSnapshot)}`
              : "Chưa có giá"}
        </p>
        {!isFinalized && (
          <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--admin-text-subtle)" }}>
            Giá dự kiến theo tính toán hệ thống — chưa phải giá báo chính thức cho khách.
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Giá cuối (VNĐ)</label>
          <input type="number" min="0" value={finalPrice} onChange={(e) => { setFinalPrice(e.target.value); setSaved(false); }} className="admin-input mt-1" />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Điều chỉnh thủ công (+/-)</label>
          <input type="number" value={manualAdjustment} onChange={(e) => { setManualAdjustment(e.target.value); setSaved(false); }} placeholder="vd: -100000" className="admin-input mt-1" />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Ghi chú nội bộ</label>
          <textarea value={internalNote} onChange={(e) => { setInternalNote(e.target.value); setSaved(false); }} rows={2} className="admin-input mt-1 resize-none" />
        </div>
        {saveError && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>{saveError}</p>
        )}
        {saved && !saveError && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-success)", background: "var(--admin-success-soft)", border: "1px solid rgba(21,128,61,0.20)" }}>Đã lưu giá cuối.</p>
        )}
        {/* Secondary weight (outlined, not filled) -- the drawer's one filled-primary action is
            the status update at the bottom, so this doesn't compete with it as an equally loud
            "primary" button. */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: "var(--admin-primary)", color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu giá cuối"}
        </button>
      </div>
    </section>
  );
}

// ─── DetailDrawer ──────────────────────────────────────────────────────────────

function DetailDrawer({
  quote, open, token, onClose, onStatusUpdated,
}: {
  quote: QuoteRequestDto | null;
  open: boolean;
  token: string;
  onClose: () => void;
  onStatusUpdated: (updated: QuoteRequestDto) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteRequestStatus>("New");
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (quote) { setSelectedStatus(quote.status); setSaveNotice(null); setSaveError(null); }
  }, [quote]);

  // Focus lifecycle — same pattern as the shared Modal primitive: capture whatever triggered
  // the drawer, move focus into the panel on open, and restore it on close (skipped if the
  // trigger row is no longer in the DOM). Keyed on `open` alone so it runs exactly once per
  // open/close cycle instead of re-capturing on every parent re-render.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      if (previouslyFocusedRef.current?.isConnected) previouslyFocusedRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  async function handleSave() {
    if (!quote) return;
    setSaving(true); setSaveNotice(null); setSaveError(null);
    try {
      const result = await updateQuoteRequestStatus(quote.id, selectedStatus, token);
      setSaveNotice(notificationOutcomeToNotice(result.notification.outcome));
      onStatusUpdated(result.quote);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  }

  function DrawerField({ label, value, fallback }: { label: string; value?: string | null; fallback?: string }) {
    const hasValue = value?.trim();
    const display = hasValue ? value! : (fallback ?? "—");
    return (
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>{label}</p>
        <p className="mt-0.5 text-sm" style={{ color: hasValue ? "var(--admin-text)" : "var(--admin-text-subtle)" }}>{display}</p>
      </div>
    );
  }

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-[150] bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — white surface on light workspace */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết yêu cầu báo giá"
        tabIndex={-1}
        className={`fixed right-0 top-0 z-[200] flex h-full w-full flex-col shadow-2xl outline-none transition-transform duration-200 ease-out sm:w-[480px] ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "var(--admin-surface)",
          borderLeft: "1px solid var(--admin-border)",
        }}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>Chi tiết yêu cầu báo giá</p>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="admin-focus-ring rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--admin-text-subtle)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text)"; (e.currentTarget as HTMLElement).style.background = "var(--admin-surface-muted)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!quote ? (
            <p className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>Chọn một yêu cầu để xem chi tiết.</p>
          ) : (
            <div className="space-y-6">
              {/* Customer */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>Thông tin khách hàng</p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <DrawerField label="Họ tên"       value={quote.fullName} />
                  <DrawerField label="Số điện thoại" value={quote.phone} />
                  <DrawerField label="Email"         value={quote.email}       fallback="Không có email" />
                  <DrawerField label="Công ty"       value={quote.companyName} fallback="Chưa có công ty" />
                </div>
              </section>

              <div className="h-px" style={{ background: "var(--admin-border)" }} />

              {/* Request */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>Yêu cầu</p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <div className="col-span-2">
                    <DrawerField label="Sản phẩm" value={quote.productNameSnapshot} fallback="Chưa có sản phẩm" />
                  </div>
                  <DrawerField label="Danh mục" value={quote.categoryNameSnapshot} fallback="Chưa có danh mục" />
                  <DrawerField label="Số lượng"  value={String(quote.quantity)} />
                  <DrawerField label="Ngày cần"  value={quote.neededDate ? formatDate(quote.neededDate) : null} fallback="Chưa xác định" />
                  <DrawerField label="Mục đích"  value={quote.useCase}   fallback="Không ghi rõ" />
                </div>
                <div className="mt-3.5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Ghi chú</p>
                  <p className="mt-0.5 text-sm leading-relaxed" style={{ color: quote.message ? "var(--admin-text)" : "var(--admin-text-subtle)" }}>
                    {quote.message || "Chưa có ghi chú"}
                  </p>
                </div>
              </section>

              {quote.calculatedTotalSnapshot != null && (
                <>
                  <div className="h-px" style={{ background: "var(--admin-border)" }} />
                  <PricingBreakdownSection quote={quote} />
                  <div className="h-px" style={{ background: "var(--admin-border)" }} />
                  <FinalPriceSection quote={quote} token={token} onSaved={onStatusUpdated} />
                </>
              )}

              <div className="h-px" style={{ background: "var(--admin-border)" }} />

              {/* Metadata */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "var(--admin-primary)" }}>Trạng thái & thời gian</p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Trạng thái hiện tại</p>
                    <div className="mt-1"><StatusBadge status={quote.status} /></div>
                  </div>
                  <DrawerField label="Ngày gửi" value={formatDateTime(quote.createdAt)} />
                  <div className="col-span-2">
                    <DrawerField label="Cập nhật lần cuối" value={formatDateTime(quote.updatedAt)} />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Status update footer */}
        {quote && (
          <div className="shrink-0 px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <p className="text-[11px] font-medium" style={{ color: "var(--admin-text-subtle)" }}>Cập nhật trạng thái</p>
            <select
              id="quote-status-select"
              aria-label="Chọn trạng thái mới"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value as QuoteRequestStatus); setSaveNotice(null); setSaveError(null); }}
              className="admin-input"
            >
              {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {saveError && (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {saveError}
              </p>
            )}
            {saveNotice && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg px-3 py-2"
                style={
                  saveNotice.tone === "success"
                    ? { border: "1px solid rgba(21,128,61,0.22)", background: "var(--admin-success-soft)" }
                    : { border: "1px solid rgba(180,83,9,0.22)", background: "var(--admin-warning-soft)" }
                }
              >
                {saveNotice.tone === "success" ? (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-success)" }} />
                ) : (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-warning)" }} />
                )}
                <p className="text-xs leading-relaxed" style={{ color: saveNotice.tone === "success" ? "var(--admin-success)" : "var(--admin-warning)" }}>
                  {saveNotice.text}
                </p>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || selectedStatus === quote.status}
              className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--admin-primary)" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Đang lưu..." : "Lưu trạng thái"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminQuoteRequestsPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [quotes, setQuotes] = useState<QuoteRequestDto[]>([]);
  const [pagination, setPagination] = useState<{
    totalCount: number; totalPages: number; hasNext: boolean; hasPrev: boolean;
  } | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Summary counts ────────────────────────────────────────────────────────
  const [counts, setCounts] = useState<{
    total: number | null; newCount: number | null; contacted: number | null; quoted: number | null;
  }>({ total: null, newCount: null, contacted: null, quoted: null });

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "all">("all");
  const [page, setPage] = useState(1);

  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("nan_admin_token");
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 320);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const loadCounts = useCallback(async (tk: string) => {
    try {
      const [total, newRes, contactedRes, quotedRes] = await Promise.all([
        getQuoteRequests({ pageSize: 1 }, tk),
        getQuoteRequests({ pageSize: 1, status: "New" }, tk),
        getQuoteRequests({ pageSize: 1, status: "Contacted" }, tk),
        getQuoteRequests({ pageSize: 1, status: "Quoted" }, tk),
      ]);
      setCounts({ total: total.totalCount, newCount: newRes.totalCount, contacted: contactedRes.totalCount, quoted: quotedRes.totalCount });
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { if (token) loadCounts(token); }, [token, loadCounts]);

  const loadQuotes = useCallback(async () => {
    if (!token) return;
    setListLoading(true); setListError(null);
    try {
      const result = await getQuoteRequests({
        pageNumber: page, pageSize: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }, token);
      setQuotes(result.items);
      setPagination({ totalCount: result.totalCount, totalPages: result.totalPages, hasNext: result.hasNextPage, hasPrev: result.hasPreviousPage });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Tải dữ liệu thất bại.");
    } finally {
      setListLoading(false);
    }
  }, [token, page, statusFilter, debouncedSearch]);

  useEffect(() => { if (token) loadQuotes(); }, [token, loadQuotes]);

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault(); setLoginLoading(true); setLoginError(null);
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

  function openDrawer(q: QuoteRequestDto) { setSelectedQuote(q); setDrawerOpen(true); }
  const closeDrawer = useCallback(() => { setDrawerOpen(false); }, []);

  function handleStatusUpdated(updated: QuoteRequestDto) {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setSelectedQuote(updated);
    if (selectedQuote && selectedQuote.status !== updated.status) {
      const oldS = selectedQuote.status;
      const newS = updated.status;
      setCounts((prev) => {
        const next = { ...prev };
        const dec = (n: number | null) => (n !== null ? Math.max(0, n - 1) : null);
        const inc = (n: number | null) => (n !== null ? n + 1 : null);
        if (oldS === "New")       next.newCount  = dec(next.newCount);
        if (oldS === "Contacted") next.contacted = dec(next.contacted);
        if (oldS === "Quoted")    next.quoted    = dec(next.quoted);
        if (newS === "New")       next.newCount  = inc(next.newCount);
        if (newS === "Contacted") next.contacted = inc(next.contacted);
        if (newS === "Quoted")    next.quoted    = inc(next.quoted);
        return next;
      });
    }
  }

  const isFiltered = statusFilter !== "all" || debouncedSearch.length > 0;

  if (!token) {
    return (
      <AdminLoginForm
        email={loginEmail} password={loginPassword}
        loading={loginLoading} error={loginError}
        setEmail={setLoginEmail} setPassword={setLoginPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" style={{ color: "var(--admin-text)" }}>
        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>Yêu cầu báo giá</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-subtle)" }}>
            Theo dõi và xử lý các yêu cầu báo giá được gửi từ website Nan.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Tổng yêu cầu" value={counts.total}     accentCls={STATUS_ACCENT.total} />
          <SummaryCard label="Mới"           value={counts.newCount}  accentCls={STATUS_ACCENT.newCount} />
          <SummaryCard label="Đã liên hệ"   value={counts.contacted} accentCls={STATUS_ACCENT.contacted} />
          <SummaryCard label="Đã báo giá"   value={counts.quoted}    accentCls={STATUS_ACCENT.quoted} />
        </div>

        {/* Filters — search + status live in one bordered control zone so they read as a
            single coherent tool, not two unrelated rows stacked above the table. */}
        <div
          className="mb-5 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
        >
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-subtle)" }} />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm yêu cầu báo giá"
              className="admin-focus-ring h-9 w-full rounded-lg pl-8 pr-8 text-sm outline-none transition"
              style={{ background: "var(--admin-canvas)", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Xóa tìm kiếm"
                className="admin-focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded transition-colors"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo trạng thái">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as QuoteRequestStatus | "all")}
                aria-pressed={statusFilter === opt.value}
                className="admin-focus-ring rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.10em] transition-colors"
                style={
                  statusFilter === opt.value
                    ? { borderColor: "var(--admin-primary)", background: "var(--admin-primary-soft)", color: "var(--admin-primary)" }
                    : { borderColor: "var(--admin-border-strong)", background: "transparent", color: "var(--admin-text-subtle)" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table — horizontal scroll container so the price column never forces the
            other columns to truncate awkwardly at tablet widths (~768-1023px). */}
        <div className="hidden overflow-x-auto rounded-xl sm:block" style={{ border: "1px solid var(--admin-border)" }}>
          <table className="w-full min-w-[880px] text-left" style={{ background: "var(--admin-surface)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}>
                {["Khách hàng", "Liên hệ", "Sản phẩm", "Số lượng", "Trạng thái", "Ngày gửi", "Giá", ""].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLoading && <SkeletonRows />}
              {!listLoading && listError && (
                <tr><td colSpan={8} className="px-4"><ErrorBanner message={listError} onRetry={loadQuotes} /></td></tr>
              )}
              {!listLoading && !listError && quotes.length === 0 && (
                <tr><td colSpan={8}><EmptyState filtered={isFiltered} /></td></tr>
              )}
              {!listLoading && !listError && quotes.map((q) => (
                <tr
                  key={q.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-primary-soft)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium" style={{ color: "var(--admin-text)" }}>{q.fullName}</p>
                    {q.companyName && <p className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{q.companyName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px]" style={{ color: "var(--admin-text-muted)" }}>{q.phone}</p>
                    {q.email && <p className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{q.email}</p>}
                  </td>
                  <td className="max-w-[160px] px-4 py-3">
                    <p className="truncate text-[12px]" style={{ color: "var(--admin-text-muted)" }}>{dash(q.productNameSnapshot)}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] tabular-nums" style={{ color: "var(--admin-text-muted)" }}>
                    {q.quantity.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-3 font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{formatDate(q.createdAt)}</td>
                  <td className="px-4 py-3"><PriceCell quote={q} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDrawer(q)}
                      className="admin-focus-ring flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] transition-colors"
                      style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-primary)";
                        (e.currentTarget as HTMLElement).style.color = "var(--admin-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border-strong)";
                        (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)";
                      }}
                    >
                      <Eye size={12} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden">
          {listLoading && <SkeletonCards />}
          {!listLoading && listError && <ErrorBanner message={listError} onRetry={loadQuotes} />}
          {!listLoading && !listError && (
            quotes.length === 0 ? <EmptyState filtered={isFiltered} /> : (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <div key={q.id} className="rounded-xl p-4" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>{q.fullName}</p>
                        {q.companyName && <p className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{q.companyName}</p>}
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="mt-2 text-[12px]" style={{ color: "var(--admin-text-muted)" }}>{q.phone}</p>
                    <p className="mt-1 truncate text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
                      {dash(q.productNameSnapshot)} &middot; {q.quantity.toLocaleString("vi-VN")} cái
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <PriceCell quote={q} />
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>{formatDate(q.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => openDrawer(q)}
                      className="admin-focus-ring mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors"
                      style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
                    >
                      <Eye size={13} /> Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="font-mono text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
              Trang {page} / {pagination.totalPages} &middot; {pagination.totalCount} yêu cầu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev || listLoading}
                aria-label="Trang trước"
                className="admin-focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}
              >
                <ChevronLeft size={13} /> Trước
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext || listLoading}
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
        {!listLoading && !listError && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={loadQuotes}
              className="admin-focus-ring flex items-center gap-1.5 rounded text-[11px] transition-colors"
              style={{ color: "var(--admin-text-subtle)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text-muted)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)"; }}
            >
              <RefreshCw size={11} /> Làm mới
            </button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {token && (
        <DetailDrawer
          quote={selectedQuote}
          open={drawerOpen}
          token={token}
          onClose={closeDrawer}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </>
  );
}
