"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import {
  createOptionDefinition,
  deleteOptionDefinition,
  getOptionDefinitions,
  updateOptionDefinition,
} from "@/lib/api/optionDefinitions";
import { formatVnd } from "@/lib/format";
import { OPTION_TYPES, optionTypeLabel } from "@/lib/optionTypes";
import Modal from "@/components/ui/Modal";
import type {
  CreateOptionDefinitionInput,
  OptionDefinition,
  PriceAdjustmentType,
} from "@/types/catalog";

// ─── Design tokens (light admin system) ──────────────────────────────────────

const INPUT_CLS =
  "admin-input";
const LABEL_CLS = "block text-xs font-medium mb-1.5";
const HINT_CLS = "mt-1.5 text-[11px] leading-snug";
const ERROR_CLS = "mt-1.5 text-[11px] leading-snug";

const ADJUSTMENT_TYPES: PriceAdjustmentType[] = ["None", "FixedPerUnit", "FixedPerOrder"];
const ADJUSTMENT_LABELS: Record<PriceAdjustmentType, string> = {
  None: "Không cộng thêm",
  FixedPerUnit: "Theo mỗi sản phẩm",
  FixedPerOrder: "Theo mỗi đơn hàng",
};
const ADJUSTMENT_HELP: Record<PriceAdjustmentType, string> = {
  None: "Tùy chọn này không cộng thêm chi phí nào — giá sẽ tự động là 0đ.",
  FixedPerUnit: "Khoản này được cộng vào giá của MỖI sản phẩm khách đặt (nhân theo số lượng).",
  FixedPerOrder: "Khoản này chỉ cộng MỘT LẦN cho cả đơn hàng, không nhân theo số lượng.",
};
const ADJUSTMENT_PRICE_LABEL: Record<PriceAdjustmentType, string> = {
  None: "Giá cộng thêm",
  FixedPerUnit: "Giá cộng thêm / sản phẩm",
  FixedPerOrder: "Phí cộng thêm / đơn hàng",
};

function formatOptionPrice(amount: number, type: string): string {
  if (type === "None") return "Không cộng thêm";
  const suffix = type === "FixedPerOrder" ? "/đơn" : "/cái";
  return `${amount > 0 ? "+" : ""}${formatVnd(amount)}${suffix}`;
}

// ─── Form value model ─────────────────────────────────────────────────────────

interface FormValues {
  optionType: string;
  optionName: string;
  optionValue: string;
  priceAdjustmentType: PriceAdjustmentType;
  priceInput: string;
  isActive: boolean;
}

function emptyForm(optionType: string): FormValues {
  return { optionType, optionName: "", optionValue: "", priceAdjustmentType: "FixedPerUnit", priceInput: "", isActive: true };
}

function formFromDefinition(d: OptionDefinition): FormValues {
  return {
    optionType: d.optionType,
    optionName: d.optionName,
    optionValue: d.optionValue,
    priceAdjustmentType: d.priceAdjustmentType,
    priceInput: String(d.additionalPrice),
    isActive: d.isActive,
  };
}

interface FormErrors {
  optionName?: string;
  optionValue?: string;
  price?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.optionName.trim()) errors.optionName = "Vui lòng nhập tên.";
  if (!values.optionValue.trim()) errors.optionValue = "Vui lòng nhập giá trị khách hàng thấy.";
  if (values.priceAdjustmentType !== "None") {
    const trimmed = values.priceInput.trim();
    if (trimmed === "") {
      errors.price = "Vui lòng nhập giá cộng thêm (nhập 0 nếu thực sự không cộng thêm).";
    } else {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) errors.price = "Giá phải là một số.";
      else if (parsed < 0) errors.price = "Giá không được nhỏ hơn 0.";
    }
  }
  return errors;
}

function toApiPayload(values: FormValues, sortOrder: number): CreateOptionDefinitionInput {
  const price = values.priceAdjustmentType === "None" ? 0 : Number(values.priceInput.trim());
  return {
    optionType: values.optionType,
    optionName: values.optionName.trim(),
    optionValue: values.optionValue.trim(),
    priceAdjustmentType: values.priceAdjustmentType,
    additionalPrice: price,
    sortOrder,
    isActive: values.isActive,
  };
}

// ─── Field primitive ──────────────────────────────────────────────────────────

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--admin-danger)" }} aria-hidden="true">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className={ERROR_CLS} style={{ color: "var(--admin-danger)" }}>{error}</p>
      ) : hint ? (
        <p className={HINT_CLS} style={{ color: "var(--admin-text-subtle)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Catalog entry form (shared by Create and Edit) ──────────────────────────

function DefinitionForm({ values, onChange, errors }: { values: FormValues; onChange: (v: FormValues) => void; errors: FormErrors }) {
  const priceDisabled = values.priceAdjustmentType === "None";

  return (
    <div className="space-y-3.5">
      <Field label="Nhóm tùy chọn" required hint="Loại thông số này thuộc về, ví dụ: Kích thước, Chất liệu, Loại nan.">
        {(id) => (
          <select id={id} value={values.optionType} onChange={(e) => onChange({ ...values, optionType: e.target.value })} className={INPUT_CLS}>
            {OPTION_TYPES.map((t) => <option key={t} value={t}>{optionTypeLabel(t)}</option>)}
          </select>
        )}
      </Field>

      <Field label="Tên" required error={errors.optionName} hint='Tên ngắn mô tả tùy chọn này (vd: "Nan", "Chất liệu").'>
        {(id) => (
          <input id={id} type="text" value={values.optionName} onChange={(e) => onChange({ ...values, optionName: e.target.value })} placeholder="Nan" className={INPUT_CLS} />
        )}
      </Field>

      <Field label="Giá trị khách hàng thấy" required error={errors.optionValue} hint='Lựa chọn cụ thể khách hàng sẽ nhìn thấy và chọn (vd: "Nan tre").'>
        {(id) => (
          <input id={id} type="text" value={values.optionValue} onChange={(e) => onChange({ ...values, optionValue: e.target.value })} placeholder="Nan tre" className={INPUT_CLS} />
        )}
      </Field>

      <Field label="Cách tính giá" required hint={ADJUSTMENT_HELP[values.priceAdjustmentType]}>
        {(id) => (
          <select
            id={id}
            value={values.priceAdjustmentType}
            onChange={(e) => {
              const nextType = e.target.value as PriceAdjustmentType;
              onChange({ ...values, priceAdjustmentType: nextType, priceInput: nextType === "None" ? "" : values.priceInput });
            }}
            className={INPUT_CLS}
          >
            {ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{ADJUSTMENT_LABELS[t]}</option>)}
          </select>
        )}
      </Field>

      {!priceDisabled && (
        <Field label={ADJUSTMENT_PRICE_LABEL[values.priceAdjustmentType]} required error={errors.price}>
          {(id) => (
            <div className="relative">
              <input
                id={id}
                type="number"
                inputMode="decimal"
                min="0"
                step="500"
                value={values.priceInput}
                onChange={(e) => onChange({ ...values, priceInput: e.target.value })}
                placeholder="Nhập số tiền, vd: 1500"
                className={`${INPUT_CLS} pr-10`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--admin-text-subtle)" }}>đ</span>
            </div>
          )}
        </Field>
      )}

      {priceDisabled && (
        <div
          className="rounded-lg px-3 py-2.5 text-xs"
          style={{
            border: "1px dashed var(--admin-border-strong)",
            background: "var(--admin-surface-muted)",
            color: "var(--admin-text-subtle)",
          }}
        >
          Giá sẽ tự động là <span className="font-medium" style={{ color: "var(--admin-text)" }}>0đ</span> — không cộng thêm chi phí cho khách hàng.
        </div>
      )}

      {/* Live preview */}
      <div
        className="rounded-lg px-3 py-2.5"
        style={{
          border: "1px solid var(--admin-border)",
          background: "var(--admin-surface-muted)",
        }}
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.12em] mb-1" style={{ color: "var(--admin-text-subtle)" }}>Xem trước</p>
        <p className="text-sm" style={{ color: "var(--admin-text)" }}>
          <span style={{ color: "var(--admin-text-subtle)" }}>{optionTypeLabel(values.optionType)}</span>
          <span className="mx-1.5" style={{ color: "var(--admin-border-strong)" }}>→</span>
          <span className="font-medium">{values.optionValue.trim() || "…"}</span>
          <span className="mx-1.5" style={{ color: "var(--admin-border-strong)" }}>→</span>
          <span style={{ color: "var(--admin-text-muted)" }}>
            {values.priceAdjustmentType === "None" ? "Không cộng thêm" : formatOptionPrice(Number(values.priceInput || 0), values.priceAdjustmentType)}
          </span>
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs" style={{ color: "var(--admin-text-muted)" }}>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => onChange({ ...values, isActive: e.target.checked })}
          className="h-3.5 w-3.5 rounded"
          style={{ accentColor: "var(--admin-primary)" }}
        />
        Đang hoạt động (có thể được gắn vào sản phẩm)
      </label>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="mb-2 h-2.5 w-24 rounded admin-skeleton" />
          <div className="space-y-1.5">
            {[0, 1].map((r) => <div key={r} className="h-16 rounded-lg admin-skeleton" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOptionsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [definitions, setDefinitions] = useState<OptionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const [createValues, setCreateValues] = useState<FormValues>(() => emptyForm(OPTION_TYPES[0]));
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);
  const [createApiError, setCreateApiError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues>(() => emptyForm(OPTION_TYPES[0]));
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editApiError, setEditApiError] = useState<string | null>(null);

  const [listNotice, setListNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OptionDefinition | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function load(tk: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getOptionDefinitions(tk, false);
      setDefinitions(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải danh mục tùy chọn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => load(token), 0);
    return () => window.clearTimeout(timer);
  }, [token]);

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

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = definitions.filter((d) => {
      if (!showInactive && !d.isActive) return false;
      if (!term) return true;
      return d.optionName.toLowerCase().includes(term) || d.optionValue.toLowerCase().includes(term);
    });
    const byType = new Map<string, OptionDefinition[]>();
    for (const d of filtered) {
      const list = byType.get(d.optionType) ?? [];
      list.push(d);
      byType.set(d.optionType, list);
    }
    return Array.from(byType.entries())
      .sort(([a], [b]) => OPTION_TYPES.indexOf(a as (typeof OPTION_TYPES)[number]) - OPTION_TYPES.indexOf(b as (typeof OPTION_TYPES)[number]))
      .map(([optionType, options]) => ({
        optionType,
        options: options.sort((a, b) => a.sortOrder - b.sortOrder || a.optionValue.localeCompare(b.optionValue)),
      }));
  }, [definitions, search, showInactive]);

  function nextSortOrderFor(optionType: string): number {
    const inGroup = definitions.filter((d) => d.optionType === optionType);
    return inGroup.length === 0 ? 0 : Math.max(...inGroup.map((d) => d.sortOrder)) + 1;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const errors = validate(createValues);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCreating(true);
    setCreateApiError(null);
    setCreateSuccess(false);
    try {
      await createOptionDefinition(toApiPayload(createValues, nextSortOrderFor(createValues.optionType)), token);
      setCreateValues(emptyForm(createValues.optionType));
      setCreateSuccess(true);
      await load(token);
    } catch (err) {
      setCreateApiError(err instanceof Error ? err.message : "Tạo tùy chọn thất bại. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(d: OptionDefinition) {
    setEditingId(d.id);
    setEditValues(formFromDefinition(d));
    setEditErrors({});
    setEditApiError(null);
  }

  async function handleSaveEdit(d: OptionDefinition) {
    if (!token) return;
    const errors = validate(editValues);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingEdit(true);
    setEditApiError(null);
    try {
      await updateOptionDefinition(d.id, toApiPayload(editValues, d.sortOrder), token);
      setEditingId(null);
      setListNotice({ type: "success", text: `Đã cập nhật "${editValues.optionValue.trim()}".` });
      await load(token);
    } catch (err) {
      setEditApiError(err instanceof Error ? err.message : "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeactivateToggle(d: OptionDefinition) {
    if (!token) return;
    try {
      await updateOptionDefinition(d.id, {
        optionType: d.optionType, optionName: d.optionName, optionValue: d.optionValue,
        priceAdjustmentType: d.priceAdjustmentType, additionalPrice: d.additionalPrice,
        sortOrder: d.sortOrder, isActive: !d.isActive,
      }, token);
      setListNotice({ type: "success", text: d.isActive ? `Đã ẩn "${d.optionValue}" khỏi danh mục.` : `Đã kích hoạt lại "${d.optionValue}".` });
      await load(token);
    } catch (err) {
      setListNotice({ type: "error", text: err instanceof Error ? err.message : "Không thể cập nhật trạng thái." });
    }
  }

  async function handleHardDelete(d: OptionDefinition) {
    if (!token) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteOptionDefinition(d.id, token);
      setPendingDelete(null);
      setListNotice({ type: "success", text: `Đã xóa "${d.optionValue}".` });
      await load(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      let text = message || "Không thể xóa tùy chọn. Vui lòng thử lại.";
      if (message.toLowerCase().includes("quote history")) {
        text = `Không thể xóa vĩnh viễn vì đã có báo giá sử dụng tùy chọn này. Vui lòng ẩn thay vì xóa.`;
      } else if (message.toLowerCase().includes("assigned to")) {
        text = `Không thể xóa vì tùy chọn này đang được gắn vào ${d.productAssignmentCount} sản phẩm. Hãy gỡ khỏi các sản phẩm đó trước, hoặc ẩn thay vì xóa.`;
      }
      setDeleteError(text);
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
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Tùy chọn sản phẩm</p>
          <p className="mb-6 text-[12px]" style={{ color: "var(--admin-text-subtle)" }}>Vui lòng đăng nhập để tiếp tục.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" className="admin-input" required />
            <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" className="admin-input" required />
            {loginError && (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loginLoading} className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "var(--admin-primary)" }}>
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-8" style={{ color: "var(--admin-text)" }}>
      {/* Form panel */}
      <div className="lg:col-span-2">
        <div
          className="rounded-2xl p-6 space-y-1 sticky top-6"
          style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", boxShadow: "0 1px 4px rgba(8,51,125,0.06)" }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>Tùy chọn sản phẩm</h1>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--admin-text-subtle)" }}>
            Quản lý các lựa chọn có thể được gắn vào sản phẩm. Tạo và chỉnh sửa giá tại đây; sản phẩm chỉ hiển thị các tùy chọn được gắn vào nó.
          </p>

          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--admin-text-muted)" }}>
            <Plus className="h-3.5 w-3.5" /> Thêm tùy chọn mới
          </p>
          <form onSubmit={handleCreate} noValidate>
            <DefinitionForm values={createValues} onChange={setCreateValues} errors={createErrors} />
            {createApiError && (
              <p className="mt-3 flex items-start gap-2 text-xs" style={{ color: "var(--admin-danger)" }}>
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{createApiError}
              </p>
            )}
            {createSuccess && !createApiError && (
              <p className="mt-3 flex items-start gap-2 text-xs" style={{ color: "var(--admin-success)" }}>
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Đã thêm vào danh mục.
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition mt-3.5 w-full"
              style={{ background: "var(--admin-primary)" }}
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Thêm tùy chọn
            </button>
          </form>
        </div>
      </div>

      {/* List panel */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "var(--admin-text)" }}>Danh mục ({definitions.length})</h2>
          <button onClick={() => token && load(token)} className="text-sm transition-colors hover:underline" style={{ color: "var(--admin-text-subtle)" }}>Làm mới</button>
        </div>

        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-subtle)" }} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc giá trị..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg pl-8 pr-3 text-sm outline-none transition"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border-strong)",
                color: "var(--admin-text)",
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
              style={{ accentColor: "var(--admin-primary)" }}
            />
            Hiện cả tùy chọn đã ẩn
          </label>
        </div>

        {loading && <CatalogSkeleton />}

        {!loading && loadError && (
          <div className="flex items-start gap-3 rounded-lg px-3.5 py-3" style={{ border: "1px solid rgba(220,38,38,0.25)", background: "var(--admin-danger-soft)" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
            <div className="flex-1">
              <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{loadError}</p>
              <button onClick={() => token && load(token)} className="mt-1.5 text-xs font-medium underline underline-offset-2" style={{ color: "var(--admin-danger)" }}>Thử lại</button>
            </div>
          </div>
        )}

        {!loading && !loadError && definitions.length === 0 && (
          <div className="rounded-lg px-4 py-8 text-center" style={{ border: "1px dashed var(--admin-border-strong)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>Chưa có tùy chọn nào trong danh mục.</p>
            <p className="mt-1.5 text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--admin-text-subtle)" }}>
              Tạo tùy chọn đầu tiên ở form bên trái, sau đó gắn vào sản phẩm khi tạo hoặc chỉnh sửa sản phẩm.
            </p>
          </div>
        )}

        {!loading && !loadError && definitions.length > 0 && groups.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: "var(--admin-text-subtle)" }}>Không tìm thấy tùy chọn phù hợp.</p>
        )}

        {!loading && !loadError && groups.length > 0 && (
          <div className="space-y-4">
            {listNotice && (
              <div
                className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs"
                style={{
                  border: listNotice.type === "success" ? "1px solid rgba(21,128,61,0.25)" : "1px solid rgba(220,38,38,0.25)",
                  background: listNotice.type === "success" ? "var(--admin-success-soft)" : "var(--admin-danger-soft)",
                  color: listNotice.type === "success" ? "var(--admin-success)" : "var(--admin-danger)",
                }}
              >
                {listNotice.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <p>{listNotice.text}</p>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.optionType}>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] mb-2" style={{ color: "var(--admin-text-subtle)" }}>
                  {optionTypeLabel(group.optionType)}
                </p>
                <div className="space-y-1.5">
                  {group.options.map((d) =>
                    editingId === d.id ? (
                      <div
                        key={d.id}
                        className="rounded-lg p-3.5"
                        style={{
                          border: "1px solid var(--admin-border-strong)",
                          background: "var(--admin-primary-soft)",
                        }}
                      >
                        <DefinitionForm values={editValues} onChange={setEditValues} errors={editErrors} />
                        {editApiError && (
                          <p className="mt-3 flex items-start gap-2 text-xs" style={{ color: "var(--admin-danger)" }}>
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{editApiError}
                          </p>
                        )}
                        <div className="mt-3.5 flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all"
                            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
                            type="button"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSaveEdit(d)}
                            disabled={savingEdit}
                            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition"
                            style={{ background: "var(--admin-primary)" }}
                            type="button"
                          >
                            {savingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Lưu thay đổi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-lg px-3.5 py-3"
                        style={{
                          border: "1px solid var(--admin-border)",
                          background: d.isActive ? "var(--admin-surface)" : "var(--admin-surface-muted)",
                          opacity: d.isActive ? 1 : 0.65,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate font-medium" style={{ color: "var(--admin-text)" }}>
                            {d.optionValue}
                            {!d.isActive && (
                              <span className="ml-2 admin-badge admin-badge-hidden">Đã ẩn</span>
                            )}
                          </p>
                          <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>{formatOptionPrice(d.additionalPrice, d.priceAdjustmentType)}</p>
                          <p className="mt-0.5 text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
                            {d.productAssignmentCount === 0 ? "Chưa gắn vào sản phẩm nào" : `${d.productAssignmentCount} sản phẩm đang sử dụng`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDeactivateToggle(d)}
                            className="flex items-center justify-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition-all"
                            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
                            aria-label={d.isActive ? `Ẩn "${d.optionValue}"` : `Kích hoạt lại "${d.optionValue}"`}
                          >
                            {d.isActive ? "Ẩn" : "Kích hoạt"}
                          </button>
                          <button
                            onClick={() => startEdit(d)}
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
                            aria-label={`Sửa "${d.optionValue}"`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setPendingDelete(d); setDeleteError(null); }}
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)" }}
                            aria-label={`Xóa "${d.optionValue}"`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal open={pendingDelete !== null} onClose={closeDeleteModal} labelledBy="delete-definition-title" maxWidthClassName="max-w-sm">
        {pendingDelete && (
          <div className="p-5">
            <h2 id="delete-definition-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
              Xóa tùy chọn &ldquo;{pendingDelete.optionValue}&rdquo;?
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--admin-text-muted)" }}>
              <span className="font-medium" style={{ color: "var(--admin-text)" }}>Ẩn</span> sẽ ngừng cho phép gắn tùy chọn này vào sản phẩm mới, nhưng giữ nguyên trong danh mục và trên các sản phẩm đang dùng.{" "}
              <span className="font-medium" style={{ color: "var(--admin-danger)" }}>Xóa vĩnh viễn</span> sẽ gỡ khỏi hệ thống hoàn toàn. Các báo giá cũ đã chốt giá luôn giữ nguyên trong cả hai trường hợp.
            </p>

            {pendingDelete.productAssignmentCount > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ border: "1px solid rgba(180,83,9,0.22)", background: "var(--admin-warning-soft)" }}>
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-warning)" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--admin-warning)" }}>
                  Đang được gắn vào {pendingDelete.productAssignmentCount} sản phẩm — cần gỡ khỏi các sản phẩm đó trước khi có thể xóa vĩnh viễn.
                </p>
              </div>
            )}

            {deleteError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-danger)" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--admin-danger)" }}>{deleteError}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDeactivateToggle(pendingDelete).then(() => setPendingDelete(null))}
                disabled={deleteBusy}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{ background: "var(--admin-primary)" }}
              >
                Ẩn tùy chọn (khuyến nghị)
              </button>
              <button
                type="button"
                onClick={() => handleHardDelete(pendingDelete)}
                disabled={deleteBusy || pendingDelete.productAssignmentCount > 0}
                className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: "rgba(220,38,38,0.30)",
                  background: "var(--admin-danger-soft)",
                  color: "var(--admin-danger)",
                }}
              >
                {deleteBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Xóa vĩnh viễn
              </button>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteBusy}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition"
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
