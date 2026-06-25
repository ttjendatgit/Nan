"use client";

import { useState, useEffect, useCallback } from "react";
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
  updateQuoteRequestStatus,
} from "@/lib/api/quoteRequests";
import type { QuoteRequestDto, QuoteRequestStatus } from "@/types/quote";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: QuoteRequestStatus | "all"; label: string }[] = [
  { value: "all",        label: "Tất cả"       },
  { value: "New",        label: "Mới"           },
  { value: "Contacted",  label: "Đã liên hệ"   },
  { value: "Quoted",     label: "Đã báo giá"   },
  { value: "Closed",     label: "Đã chốt"      },
  { value: "Cancelled",  label: "Đã hủy"       },
];

const STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  New:       "Mới",
  Contacted: "Đã liên hệ",
  Quoted:    "Đã báo giá",
  Closed:    "Đã chốt",
  Cancelled: "Đã hủy",
};

// Badge visual tokens — bg / text / border
const STATUS_BADGE: Record<
  QuoteRequestStatus,
  { bg: string; text: string; border: string }
> = {
  New:       { bg: "bg-[#0F2B50]/70",  text: "text-[#60A5FA]", border: "border-[#60A5FA]/30"  },
  Contacted: { bg: "bg-[#3B1F08]/70",  text: "text-[#FCD34D]", border: "border-[#FCD34D]/30"  },
  Quoted:    { bg: "bg-[#1E244F]/70",  text: "text-[#A5B4FC]", border: "border-[#A5B4FC]/30"  },
  Closed:    { bg: "bg-[#052E16]/70",  text: "text-[#4ADE80]", border: "border-[#4ADE80]/25"  },
  Cancelled: { bg: "bg-[#4C0519]/70",  text: "text-[#F87171]", border: "border-[#F87171]/30"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function dash(val?: string | null): string {
  return val?.trim() || "—";
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  const t = STATUS_BADGE[status] ?? STATUS_BADGE.New;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.10em] ${t.bg} ${t.text} ${t.border}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[#1B1C4A] bg-[#111335]/60 px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B6D6F2]/45">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${accent}`}>
        {value === null ? (
          <span className="inline-block h-6 w-10 animate-pulse rounded bg-[#1B1C4A]" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[#1B1C4A]/60">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-[#1B1C4A]/80"
                style={{ width: `${60 + ((i + j) % 3) * 15}%` }}
              />
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
        <div key={i} className="rounded-xl border border-[#1B1C4A] bg-[#111335]/40 p-4 space-y-2.5 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-[#1B1C4A]/80" />
          <div className="h-3 w-1/2 rounded bg-[#1B1C4A]/60" />
          <div className="flex justify-between">
            <div className="h-3 w-1/3 rounded bg-[#1B1C4A]/60" />
            <div className="h-5 w-20 rounded-full bg-[#1B1C4A]/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileText className="h-10 w-10 text-[#273481]" strokeWidth={1.25} />
      <p className="mt-4 text-sm font-medium text-[#B6D6F2]/60">
        {filtered ? "Không tìm thấy yêu cầu phù hợp." : "Chưa có yêu cầu báo giá nào."}
      </p>
      <p className="mt-1.5 text-xs text-[#B6D6F2]/35">
        {filtered
          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
          : "Khi khách hàng gửi yêu cầu từ website, chúng sẽ xuất hiện ở đây."}
      </p>
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-4 my-6 flex items-start gap-3 rounded-xl border border-[#F87171]/20 bg-[#4C0519]/40 px-4 py-3.5">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]" />
      <div className="flex-1">
        <p className="text-sm text-[#F87171]/90">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-lg border border-[#F87171]/25 px-3 py-1.5 text-xs text-[#F87171]/80 transition-colors hover:bg-[#F87171]/10 hover:text-[#F87171]"
      >
        Thử lại
      </button>
    </div>
  );
}

// ─── AdminLoginForm ────────────────────────────────────────────────────────────

function AdminLoginForm({
  email, password, loading, error,
  setEmail, setPassword,
  onSubmit,
}: {
  email: string; password: string; loading: boolean; error: string | null;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
}) {
  const inputCls =
    "w-full rounded-lg border border-[#1B1C4A] bg-[#080C15] px-3.5 py-2.5 text-sm text-white placeholder-[#B6D6F2]/25 outline-none transition focus:border-[#273481] focus:ring-1 focus:ring-[#273481]/40";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-[340px]">
        <p className="mb-1.5 font-serif text-[18px] font-semibold text-white">
          Yêu cầu báo giá
        </p>
        <p className="mb-6 text-[12px] text-[#B6D6F2]/40">
          Vui lòng đăng nhập để tiếp tục.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputCls}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
            required
          />
          {error && (
            <p className="rounded-lg border border-[#F87171]/20 bg-[#4C0519]/40 px-3 py-2 text-xs text-[#F87171]/90">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#273481] py-2.5 text-sm font-medium text-white transition hover:bg-[#1B1C4A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── DetailDrawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  quote, open, token,
  onClose, onStatusUpdated,
}: {
  quote: QuoteRequestDto | null;
  open: boolean;
  token: string;
  onClose: () => void;
  onStatusUpdated: (updated: QuoteRequestDto) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteRequestStatus>("New");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (quote) {
      setSelectedStatus(quote.status);
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [quote]);

  // ESC key closes the drawer
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleSave() {
    if (!quote) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const updated = await updateQuoteRequestStatus(quote.id, selectedStatus, token);
      setSaveSuccess(true);
      onStatusUpdated(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "text-[10px] font-mono uppercase tracking-[0.12em] text-[#B6D6F2]/40";

  function Field({
    label, value, fallback,
  }: {
    label: string;
    value?: string | null;
    fallback?: string;
  }) {
    const hasValue = value?.trim();
    const display = hasValue ? value! : (fallback ?? "—");
    return (
      <div>
        <p className={labelCls}>{label}</p>
        <p className={`mt-0.5 text-sm ${hasValue ? "text-[#E8F2FC]" : "text-[#E8F2FC]/35"}`}>
          {display}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-[150] bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết yêu cầu báo giá"
        className={`fixed right-0 top-0 z-[200] flex h-full w-full flex-col border-l border-[#1B1C4A] bg-[#080C15] shadow-2xl transition-transform duration-200 ease-out sm:w-[480px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1B1C4A] px-5 py-4">
          <p className="text-sm font-semibold text-white">Chi tiết yêu cầu báo giá</p>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-[#B6D6F2]/45 transition-colors hover:bg-[#1B1C4A] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!quote ? (
            <p className="text-sm text-[#B6D6F2]/40">Chọn một yêu cầu để xem chi tiết.</p>
          ) : (
            <div className="space-y-6">
              {/* Customer */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#273481]">
                  Thông tin khách hàng
                </p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <Field label="Họ tên" value={quote.fullName} />
                  <Field label="Số điện thoại" value={quote.phone} />
                  <Field label="Email" value={quote.email} fallback="Không có email" />
                  <Field label="Công ty" value={quote.companyName} fallback="Chưa có công ty" />
                </div>
              </section>

              <div className="h-px bg-[#1B1C4A]" />

              {/* Request */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#273481]">
                  Yêu cầu
                </p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <div className="col-span-2">
                    <Field label="Sản phẩm" value={quote.productNameSnapshot} fallback="Chưa có sản phẩm" />
                  </div>
                  <Field label="Danh mục" value={quote.categoryNameSnapshot} fallback="Chưa có danh mục" />
                  <Field label="Số lượng" value={String(quote.quantity)} />
                  <Field label="Ngày cần" value={quote.neededDate ? formatDate(quote.neededDate) : null} fallback="Chưa xác định" />
                  <Field label="Mục đích" value={quote.useCase} fallback="Không ghi rõ" />
                </div>
                <div className="mt-3.5">
                  <p className={labelCls}>Ghi chú</p>
                  <p className={`mt-0.5 text-sm leading-relaxed ${quote.message ? "text-[#E8F2FC]/85" : "text-[#E8F2FC]/35"}`}>
                    {quote.message || "Chưa có ghi chú"}
                  </p>
                </div>
              </section>

              <div className="h-px bg-[#1B1C4A]" />

              {/* Metadata */}
              <section>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#273481]">
                  Trạng thái & thời gian
                </p>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <div>
                    <p className={labelCls}>Trạng thái hiện tại</p>
                    <div className="mt-1">
                      <StatusBadge status={quote.status} />
                    </div>
                  </div>
                  <Field label="Ngày gửi" value={formatDateTime(quote.createdAt)} />
                  <div className="col-span-2">
                    <Field label="Cập nhật lần cuối" value={formatDateTime(quote.updatedAt)} />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Status update footer */}
        {quote && (
          <div className="shrink-0 border-t border-[#1B1C4A] px-5 py-4 space-y-3">
            <p className="text-[11px] font-medium text-[#B6D6F2]/55">
              Cập nhật trạng thái
            </p>

            <select
              id="quote-status-select"
              aria-label="Chọn trạng thái mới"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as QuoteRequestStatus);
                setSaveSuccess(false);
                setSaveError(null);
              }}
              className="w-full rounded-lg border border-[#1B1C4A] bg-[#0D131F] px-3 py-2.5 text-sm text-[#E8F2FC] outline-none transition focus:border-[#273481] focus:ring-1 focus:ring-[#273481]/40"
            >
              {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {saveError && (
              <p className="rounded-lg border border-[#F87171]/20 bg-[#4C0519]/40 px-3 py-2 text-xs text-[#F87171]/90">
                {saveError}
              </p>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-[#4ADE80]/20 bg-[#052E16]/60 px-3 py-2">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
                <p className="text-xs text-[#4ADE80]/90">Cập nhật trạng thái thành công.</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || selectedStatus === quote.status}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#273481] py-2.5 text-sm font-medium text-white transition hover:bg-[#1B2F6E] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminQuoteRequestsPage() {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [quotes, setQuotes] = useState<QuoteRequestDto[]>([]);
  const [pagination, setPagination] = useState<{
    totalCount: number; totalPages: number;
    hasNext: boolean; hasPrev: boolean;
  } | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ── Summary counts ────────────────────────────────────────────────────────
  const [counts, setCounts] = useState<{
    total: number | null; newCount: number | null;
    contacted: number | null; quoted: number | null;
  }>({ total: null, newCount: null, contacted: null, quoted: null });

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "all">("all");
  const [page, setPage] = useState(1);

  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Init: read token from sessionStorage ─────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("nan_admin_token");
    if (stored) setToken(stored);
  }, []);

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 320);
    return () => window.clearTimeout(id);
  }, [search]);

  // ── Reset page on filter change ───────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ── Load summary counts ───────────────────────────────────────────────────
  const loadCounts = useCallback(async (tk: string) => {
    try {
      const [total, newRes, contactedRes, quotedRes] = await Promise.all([
        getQuoteRequests({ pageSize: 1 }, tk),
        getQuoteRequests({ pageSize: 1, status: "New" }, tk),
        getQuoteRequests({ pageSize: 1, status: "Contacted" }, tk),
        getQuoteRequests({ pageSize: 1, status: "Quoted" }, tk),
      ]);
      setCounts({
        total:     total.totalCount,
        newCount:  newRes.totalCount,
        contacted: contactedRes.totalCount,
        quoted:    quotedRes.totalCount,
      });
    } catch {
      // Non-critical — leave counts as null (shown as skeleton)
    }
  }, []);

  useEffect(() => {
    if (token) loadCounts(token);
  }, [token, loadCounts]);

  // ── Load quotes ───────────────────────────────────────────────────────────
  const loadQuotes = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    setListError(null);
    try {
      const result = await getQuoteRequests(
        {
          pageNumber: page,
          pageSize: PAGE_SIZE,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: debouncedSearch || undefined,
        },
        token,
      );
      setQuotes(result.items);
      setPagination({
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tải dữ liệu thất bại.";
      setListError(msg);
    } finally {
      setListLoading(false);
    }
  }, [token, page, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (token) loadQuotes();
  }, [token, loadQuotes]);

  // ── Login handler ─────────────────────────────────────────────────────────
  async function handleLogin(e: { preventDefault(): void }) {
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

  // ── Drawer handlers ───────────────────────────────────────────────────────
  function openDrawer(q: QuoteRequestDto) {
    setSelectedQuote(q);
    setDrawerOpen(true);
  }

  // useCallback keeps the reference stable so the ESC-key effect in
  // DetailDrawer does not re-register the listener on every parent render.
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  function handleStatusUpdated(updated: QuoteRequestDto) {
    // Update the item in the list
    setQuotes((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q)),
    );
    // Update detail drawer
    setSelectedQuote(updated);
    // Optimistic count adjustment
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

  // ── No token: show login form ─────────────────────────────────────────────
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

  // ── Main content ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Yêu cầu báo giá
          </h1>
          <p className="mt-1 text-sm text-[#B6D6F2]/45">
            Theo dõi và xử lý các yêu cầu báo giá được gửi từ website Nan.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Tổng yêu cầu" value={counts.total}     accent="text-white" />
          <SummaryCard label="Mới"           value={counts.newCount}  accent="text-[#60A5FA]" />
          <SummaryCard label="Đã liên hệ"   value={counts.contacted} accent="text-[#FCD34D]" />
          <SummaryCard label="Đã báo giá"   value={counts.quoted}    accent="text-[#A5B4FC]" />
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B6D6F2]/35" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#1B1C4A] bg-[#111335]/60 pl-8 pr-8 text-sm text-[#E8F2FC] placeholder-[#B6D6F2]/28 outline-none transition focus:border-[#273481] focus:ring-1 focus:ring-[#273481]/35"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B6D6F2]/40 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as QuoteRequestStatus | "all")}
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.10em] transition-colors ${
                  statusFilter === opt.value
                    ? "border-[#273481] bg-[#273481]/30 text-[#B6D6F2]"
                    : "border-[#1B1C4A] bg-transparent text-[#B6D6F2]/45 hover:border-[#273481]/60 hover:text-[#B6D6F2]/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content: desktop table */}
        <div className="overflow-hidden rounded-xl border border-[#1B1C4A] bg-[#0A0E1A] hidden sm:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1B1C4A] bg-[#111335]/40">
                {["Khách hàng", "Liên hệ", "Sản phẩm", "Số lượng", "Trạng thái", "Ngày gửi", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#B6D6F2]/38"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {listLoading && <SkeletonRows />}
              {!listLoading && listError && (
                <tr>
                  <td colSpan={7} className="px-4">
                    <ErrorBanner message={listError} onRetry={loadQuotes} />
                  </td>
                </tr>
              )}
              {!listLoading && !listError && quotes.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState filtered={isFiltered} />
                  </td>
                </tr>
              )}
              {!listLoading && !listError && quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[#1B1C4A]/50 transition-colors hover:bg-[#111335]/40"
                >
                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-[#E8F2FC]">{q.fullName}</p>
                    {q.companyName && (
                      <p className="text-[11px] text-[#B6D6F2]/40">{q.companyName}</p>
                    )}
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-[12px] text-[#B6D6F2]/75">{q.phone}</p>
                    {q.email && (
                      <p className="text-[11px] text-[#B6D6F2]/40">{q.email}</p>
                    )}
                  </td>
                  {/* Product */}
                  <td className="max-w-[160px] px-4 py-3">
                    <p className="truncate text-[12px] text-[#B6D6F2]/70">
                      {dash(q.productNameSnapshot)}
                    </p>
                  </td>
                  {/* Quantity */}
                  <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-[#B6D6F2]/65">
                    {q.quantity.toLocaleString("vi-VN")}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3 font-mono text-[11px] text-[#B6D6F2]/45">
                    {formatDate(q.createdAt)}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDrawer(q)}
                      className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-2 text-[11px] text-[#B6D6F2]/55 transition-colors hover:border-[#273481]/60 hover:bg-[#111335] hover:text-[#B6D6F2]"
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

        {/* Content: mobile card list */}
        <div className="sm:hidden">
          {listLoading && <SkeletonCards />}
          {!listLoading && listError && (
            <ErrorBanner message={listError} onRetry={loadQuotes} />
          )}
          {!listLoading && !listError && (
            quotes.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-[#1B1C4A] bg-[#111335]/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#E8F2FC] truncate">{q.fullName}</p>
                        {q.companyName && (
                          <p className="text-[11px] text-[#B6D6F2]/40">{q.companyName}</p>
                        )}
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="mt-2 text-[12px] text-[#B6D6F2]/65">{q.phone}</p>
                    <p className="mt-1 truncate text-[11px] text-[#B6D6F2]/40">
                      {dash(q.productNameSnapshot)} &middot; {q.quantity.toLocaleString("vi-VN")} cái
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#B6D6F2]/35">
                        {formatDate(q.createdAt)}
                      </span>
                      <button
                        onClick={() => openDrawer(q)}
                        className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-2 text-[11px] text-[#B6D6F2]/55 transition-colors hover:border-[#273481]/60 hover:bg-[#111335] hover:text-[#B6D6F2]"
                      >
                        <Eye size={12} />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="font-mono text-[11px] text-[#B6D6F2]/38">
              Trang {page} / {pagination.totalPages} &middot;{" "}
              {pagination.totalCount} yêu cầu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev || listLoading}
                aria-label="Trang trước"
                className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-1.5 text-[12px] text-[#B6D6F2]/55 transition-colors hover:border-[#273481]/60 hover:text-[#B6D6F2] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={13} />
                Trước
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext || listLoading}
                aria-label="Trang tiếp"
                className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-1.5 text-[12px] text-[#B6D6F2]/55 transition-colors hover:border-[#273481]/60 hover:text-[#B6D6F2] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Tiếp
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Refresh hint */}
        {!listLoading && !listError && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={loadQuotes}
              className="flex items-center gap-1.5 text-[11px] text-[#B6D6F2]/35 transition-colors hover:text-[#B6D6F2]/65"
            >
              <RefreshCw size={11} />
              Làm mới
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
