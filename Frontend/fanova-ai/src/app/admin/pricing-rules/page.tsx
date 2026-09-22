"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import { getProducts } from "@/lib/api/products";
import { getProductOptionGroups } from "@/lib/api/productOptions";
import {
  createPricingRule,
  deletePricingRule,
  getPricingRulesByProduct,
  updatePricingRule,
} from "@/lib/api/pricingRules";
import { formatVnd } from "@/lib/format";
import { optionTypeLabel } from "@/lib/optionTypes";
import Modal from "@/components/ui/Modal";
import type { Product } from "@/types/catalog";
import type { CreatePricingRuleInput, PricingRule, UpdatePricingRuleInput } from "@/types/pricing";

// ─── Constants ─────────────────────────────────────────────────────────────────
// PricingRule.Material/Size/PrintingSide are matched case-insensitively against the
// SAME product's assigned OptionDefinition values for these three OptionType members
// (see PricingRuleRepository.MatchesField / PricingService.GetOptionValue on the
// backend) -- these are the only three typed matching dimensions that exist today.
const DIMENSION_TYPES = ["Material", "Size", "PrintingSide"] as const;
type DimensionType = (typeof DIMENSION_TYPES)[number];

const ANY_VALUE = "";

const PRIMARY_BTN =
  "admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-150";
const LABEL_CLS = "block text-xs font-medium mb-1.5";
const ERROR_CLS = "mt-1.5 text-[11px] leading-snug";
const HINT_CLS = "mt-1.5 text-[11px] leading-snug";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatQuantityRange(min: number, max: number | null | undefined): string {
  const minStr = min.toLocaleString("vi-VN");
  if (max == null) return `Từ ${minStr} trở lên`;
  return `${minStr} – ${max.toLocaleString("vi-VN")}`;
}

function dimensionOrAny(value: string | null | undefined): string {
  return value && value.trim() ? value : "Bất kỳ";
}

// ─── Form value model ──────────────────────────────────────────────────────────

interface FormValues {
  productId: string;
  material: string;
  size: string;
  printingSide: string;
  minQuantityInput: string;
  maxQuantityInput: string;
  baseUnitPriceInput: string;
  additionalCostInput: string;
  discountPercentInput: string;
  isActive: boolean;
}

function emptyForm(productId: string): FormValues {
  return {
    productId,
    material: ANY_VALUE,
    size: ANY_VALUE,
    printingSide: ANY_VALUE,
    minQuantityInput: "1",
    maxQuantityInput: "",
    baseUnitPriceInput: "",
    additionalCostInput: "0",
    discountPercentInput: "0",
    isActive: true,
  };
}

function formFromRule(rule: PricingRule): FormValues {
  return {
    productId: rule.productId,
    material: rule.material ?? ANY_VALUE,
    size: rule.size ?? ANY_VALUE,
    printingSide: rule.printingSide ?? ANY_VALUE,
    minQuantityInput: String(rule.minQuantity),
    maxQuantityInput: rule.maxQuantity != null ? String(rule.maxQuantity) : "",
    baseUnitPriceInput: String(rule.baseUnitPrice),
    additionalCostInput: String(rule.additionalCost),
    discountPercentInput: String(rule.discountPercent),
    isActive: rule.isActive,
  };
}

interface FormErrors {
  productId?: string;
  minQuantity?: string;
  maxQuantity?: string;
  baseUnitPrice?: string;
  additionalCost?: string;
  discountPercent?: string;
}

// Mirrors CreatePricingRuleRequestValidator / UpdatePricingRuleRequestValidator exactly
// (Backend/.../Validators/Pricing/*.cs) so obviously-invalid input never makes a round trip.
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.productId) errors.productId = "Vui lòng chọn sản phẩm.";

  const min = Number(values.minQuantityInput.trim());
  if (values.minQuantityInput.trim() === "" || Number.isNaN(min) || min <= 0) {
    errors.minQuantity = "Số lượng tối thiểu phải lớn hơn 0.";
  }

  if (values.maxQuantityInput.trim() !== "") {
    const max = Number(values.maxQuantityInput.trim());
    if (Number.isNaN(max)) {
      errors.maxQuantity = "Số lượng tối đa phải là một số.";
    } else if (!errors.minQuantity && max < min) {
      errors.maxQuantity = "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu.";
    }
  }

  const base = Number(values.baseUnitPriceInput.trim());
  if (values.baseUnitPriceInput.trim() === "" || Number.isNaN(base) || base < 0) {
    errors.baseUnitPrice = "Đơn giá phải là số từ 0 trở lên.";
  }

  const additional = Number(values.additionalCostInput.trim());
  if (values.additionalCostInput.trim() === "" || Number.isNaN(additional) || additional < 0) {
    errors.additionalCost = "Phụ phí phải là số từ 0 trở lên.";
  }

  const discount = Number(values.discountPercentInput.trim());
  if (values.discountPercentInput.trim() === "" || Number.isNaN(discount) || discount < 0 || discount > 100) {
    errors.discountPercent = "Giảm giá phải trong khoảng 0 – 100.";
  }

  return errors;
}

function toCreatePayload(values: FormValues): CreatePricingRuleInput {
  return {
    productId: values.productId,
    material: values.material.trim() || null,
    size: values.size.trim() || null,
    printingSide: values.printingSide.trim() || null,
    minQuantity: Number(values.minQuantityInput.trim()),
    maxQuantity: values.maxQuantityInput.trim() === "" ? null : Number(values.maxQuantityInput.trim()),
    baseUnitPrice: Number(values.baseUnitPriceInput.trim()),
    additionalCost: Number(values.additionalCostInput.trim()),
    discountPercent: Number(values.discountPercentInput.trim()),
    isActive: values.isActive,
  };
}

function toUpdatePayload(values: FormValues): UpdatePricingRuleInput {
  const { productId: _productId, ...rest } = toCreatePayload(values);
  void _productId;
  return { ...rest, isActive: values.isActive };
}

// ─── Field primitive (mirrors admin/options' Field) ───────────────────────────

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

// ─── Rule form (shared by Create and Edit, lives inside the Modal) ────────────

interface RuleFormProps {
  mode: "create" | "edit";
  products: Product[];
  values: FormValues;
  onChange: (v: FormValues) => void;
  errors: FormErrors;
  disabled: boolean;
  editingRule: PricingRule | null;
  token: string;
}

function RuleForm({ mode, products, values, onChange, errors, disabled, editingRule, token }: RuleFormProps) {
  const [dimensionOptions, setDimensionOptions] = useState<Record<DimensionType, string[]>>({
    Material: [], Size: [], PrintingSide: [],
  });
  const [dimensionsLoading, setDimensionsLoading] = useState(false);
  const [dimensionsError, setDimensionsError] = useState<string | null>(null);
  const prevProductIdRef = useRef<string | null>(null);

  async function loadDimensions(productId: string) {
    if (!productId) return;
    setDimensionsLoading(true);
    setDimensionsError(null);
    try {
      const grouped = await getProductOptionGroups(productId, token);
      const next: Record<DimensionType, string[]> = { Material: [], Size: [], PrintingSide: [] };
      for (const group of grouped.groups) {
        if ((DIMENSION_TYPES as readonly string[]).includes(group.optionType)) {
          const type = group.optionType as DimensionType;
          next[type] = Array.from(new Set(group.options.map((o) => o.optionValue)));
        }
      }
      setDimensionOptions(next);
    } catch (err) {
      setDimensionsError(err instanceof Error ? err.message : "Không thể tải tuỳ chọn của sản phẩm này.");
    } finally {
      setDimensionsLoading(false);
    }
  }

  useEffect(() => {
    if (!values.productId) return;
    const productChanged = prevProductIdRef.current !== null && prevProductIdRef.current !== values.productId;
    prevProductIdRef.current = values.productId;
    // Switching products in Create mode invalidates any previously picked dimension values --
    // they belong to the old product's catalog and would silently mismatch the new one.
    if (productChanged && mode === "create") {
      onChange({ ...values, material: ANY_VALUE, size: ANY_VALUE, printingSide: ANY_VALUE });
    }
    loadDimensions(values.productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.productId]);

  function optionsFor(type: DimensionType, currentValue: string): string[] {
    const fetched = dimensionOptions[type];
    // The rule's current value must always remain a selectable option, even if the underlying
    // assignment was since removed/deactivated -- otherwise saving without touching this field
    // would silently null it out.
    if (currentValue && !fetched.includes(currentValue)) return [currentValue, ...fetched];
    return fetched;
  }

  return (
    <fieldset disabled={disabled} className="space-y-3.5 border-0 p-0 m-0 disabled:opacity-60">
      <Field label="Sản phẩm" required error={errors.productId} hint={mode === "edit" ? "Không thể đổi sản phẩm của một quy tắc đã tạo." : undefined}>
        {(id) =>
          mode === "edit" ? (
            <div
              id={id}
              className="admin-input flex items-center"
              style={{ background: "var(--admin-surface-muted)", color: "var(--admin-text)" }}
            >
              {products.find((p) => p.id === values.productId)?.name ?? editingRule?.productId}
            </div>
          ) : (
            <select
              id={id}
              value={values.productId}
              onChange={(e) => onChange({ ...values, productId: e.target.value })}
              className="admin-input"
            >
              <option value="" disabled>— Chọn sản phẩm —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{!p.isActive ? " (Đã ẩn)" : ""}</option>
              ))}
            </select>
          )
        }
      </Field>

      <p className="pt-1 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        Điều kiện áp dụng
      </p>

      {dimensionsError && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ border: "1px solid rgba(180,83,9,0.22)", background: "var(--admin-warning-soft)", color: "var(--admin-warning)" }}>
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p>{dimensionsError}</p>
            <button type="button" onClick={() => loadDimensions(values.productId)} className="mt-1 underline underline-offset-2">Thử lại</button>
          </div>
        </div>
      )}

      {DIMENSION_TYPES.map((type) => {
        const field = type === "Material" ? "material" : type === "Size" ? "size" : "printingSide";
        const current = values[field];
        const opts = optionsFor(type, current);
        return (
          <Field key={type} label={optionTypeLabel(type)} hint={opts.length === 0 && !dimensionsLoading ? `Sản phẩm này chưa gắn tuỳ chọn ${optionTypeLabel(type).toLowerCase()} nào.` : undefined}>
            {(id) => (
              <select
                id={id}
                value={current}
                disabled={dimensionsLoading}
                onChange={(e) => onChange({ ...values, [field]: e.target.value })}
                className="admin-input"
              >
                <option value={ANY_VALUE}>Bất kỳ {optionTypeLabel(type).toLowerCase()}</option>
                {opts.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
          </Field>
        );
      })}

      <div className="grid grid-cols-2 gap-3">
        <Field label="SL tối thiểu" required error={errors.minQuantity}>
          {(id) => (
            <input id={id} type="number" inputMode="numeric" min="1" step="1" value={values.minQuantityInput}
              onChange={(e) => onChange({ ...values, minQuantityInput: e.target.value })} className="admin-input" />
          )}
        </Field>
        <Field label="SL tối đa" error={errors.maxQuantity} hint="Để trống nếu không giới hạn.">
          {(id) => (
            <input id={id} type="number" inputMode="numeric" min="1" step="1" value={values.maxQuantityInput}
              placeholder="Không giới hạn"
              onChange={(e) => onChange({ ...values, maxQuantityInput: e.target.value })} className="admin-input" />
          )}
        </Field>
      </div>

      <p className="pt-1 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        Giá áp dụng
      </p>

      <Field label="Đơn giá cơ bản" required error={errors.baseUnitPrice} hint="Thay thế cho giá gốc của sản phẩm khi quy tắc này khớp — không cộng dồn.">
        {(id) => (
          <div className="relative">
            <input id={id} type="number" inputMode="decimal" min="0" step="500" value={values.baseUnitPriceInput}
              onChange={(e) => onChange({ ...values, baseUnitPriceInput: e.target.value })} className="admin-input pr-10" placeholder="vd: 15000" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--admin-text-subtle)" }}>đ</span>
          </div>
        )}
      </Field>

      <Field label="Phụ phí cố định" error={errors.additionalCost} hint="Cộng một lần cho cả đơn hàng, không nhân theo số lượng.">
        {(id) => (
          <div className="relative">
            <input id={id} type="number" inputMode="decimal" min="0" step="500" value={values.additionalCostInput}
              onChange={(e) => onChange({ ...values, additionalCostInput: e.target.value })} className="admin-input pr-10" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--admin-text-subtle)" }}>đ</span>
          </div>
        )}
      </Field>

      <Field label="Giảm giá" error={errors.discountPercent} hint="Phần trăm giảm trên tổng tiền hàng trước phụ phí (0 – 100).">
        {(id) => (
          <div className="relative">
            <input id={id} type="number" inputMode="decimal" min="0" max="100" step="1" value={values.discountPercentInput}
              onChange={(e) => onChange({ ...values, discountPercentInput: e.target.value })} className="admin-input pr-8" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--admin-text-subtle)" }}>%</span>
          </div>
        )}
      </Field>

      <label className="flex items-center gap-2 text-xs" style={{ color: "var(--admin-text-muted)" }}>
        <input type="checkbox" checked={values.isActive} onChange={(e) => onChange({ ...values, isActive: e.target.checked })}
          className="h-3.5 w-3.5 rounded" style={{ accentColor: "var(--admin-primary)" }} />
        Đang áp dụng (có thể được dùng để tính giá)
      </label>
    </fieldset>
  );
}

// ─── Rule form modal ───────────────────────────────────────────────────────────

function RuleFormModal({
  open, mode, products, editingRule, defaultProductId, token, onClose, onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  products: Product[];
  editingRule: PricingRule | null;
  defaultProductId: string;
  token: string;
  onClose: () => void;
  onSaved: (notice: string) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => emptyForm(defaultProductId));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(mode === "edit" && editingRule ? formFromRule(editingRule) : emptyForm(defaultProductId));
    setErrors({});
    setApiError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, editingRule]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setApiError(null);
    try {
      const product = products.find((p) => p.id === values.productId);
      if (mode === "create") {
        await createPricingRule(toCreatePayload(values), token);
        onSaved(`Đã tạo quy tắc giá mới cho "${product?.name ?? "sản phẩm"}".`);
      } else if (editingRule) {
        await updatePricingRule(editingRule.id, toUpdatePayload(values), token);
        onSaved(`Đã cập nhật quy tắc giá cho "${product?.name ?? "sản phẩm"}".`);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Không thể lưu quy tắc giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const titleId = "pricing-rule-form-title";

  return (
    <Modal open={open} onClose={() => { if (!submitting) onClose(); }} labelledBy={titleId} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} noValidate className="p-6">
        <h2 id={titleId} className="text-base font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
          {mode === "create" ? "Thêm quy tắc giá" : "Sửa quy tắc giá"}
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--admin-text-subtle)" }}>
          {mode === "create"
            ? "Áp dụng một mức giá riêng khi đơn hàng khớp các điều kiện bên dưới."
            : `Đang sửa quy tắc cho "${products.find((p) => p.id === values.productId)?.name ?? ""}".`}
        </p>

        <RuleForm
          mode={mode}
          products={products}
          values={values}
          onChange={setValues}
          errors={errors}
          disabled={submitting}
          editingRule={editingRule}
          token={token}
        />

        {apiError && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-xs" style={{ color: "var(--admin-danger)" }}>
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{apiError}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting}
            className="admin-focus-ring rounded-lg border px-4 py-2.5 text-sm transition-all disabled:opacity-50"
            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}>
            Hủy
          </button>
          <button type="submit" disabled={submitting} className={PRIMARY_BTN} style={{ background: "var(--admin-primary)" }}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Tạo quy tắc" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteRuleModal({
  rule, productName, busy, error, onCancel, onConfirm,
}: {
  rule: PricingRule | null;
  productName: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={rule !== null} onClose={() => { if (!busy) onCancel(); }} labelledBy="delete-rule-title" maxWidthClassName="max-w-sm">
      {rule && (
        <div className="p-5">
          <h2 id="delete-rule-title" className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
            Xóa quy tắc giá của &ldquo;{productName}&rdquo;?
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--admin-text-muted)" }}>
            Đây là <span className="font-medium" style={{ color: "var(--admin-danger)" }}>hành động xóa vĩnh viễn</span>, không có bước khôi phục.
            Các báo giá đã lưu trước đó vẫn giữ nguyên và không bị ảnh hưởng.
            {rule.isActive && (
              <> Nếu chỉ muốn ngừng áp dụng tạm thời, hãy dùng <span className="font-medium" style={{ color: "var(--admin-text)" }}>Tắt</span> thay vì xóa.</>
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
      {Array.from({ length: 5 }).map((_, i) => (
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

function EmptyState({ hasProducts, filtered }: { hasProducts: boolean; filtered: boolean }) {
  if (!hasProducts) {
    return (
      <div className="px-4 py-12 text-center">
        <Tag className="mx-auto h-8 w-8" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
        <p className="mt-3 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>Chưa có sản phẩm nào.</p>
        <p className="mt-1.5 text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--admin-text-subtle)" }}>
          Quy tắc giá luôn gắn với một sản phẩm cụ thể — hãy tạo sản phẩm trước ở mục Sản phẩm.
        </p>
      </div>
    );
  }
  return (
    <div className="px-4 py-12 text-center">
      <Tag className="mx-auto h-8 w-8" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} />
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
        {filtered ? "Không tìm thấy quy tắc phù hợp." : "Chưa có quy tắc giá nào."}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--admin-text-subtle)" }}>
        {filtered ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." : "Nhấn \"Thêm quy tắc\" để tạo mức giá riêng theo số lượng, chất liệu hoặc kích thước."}
      </p>
    </div>
  );
}

// ─── Row pieces ────────────────────────────────────────────────────────────────

function DimensionChips({ rule }: { rule: PricingRule }) {
  const dims: { type: DimensionType; value: string | null | undefined }[] = [
    { type: "Material", value: rule.material },
    { type: "Size", value: rule.size },
    { type: "PrintingSide", value: rule.printingSide },
  ];
  const specific = dims.filter((d) => d.value && d.value.trim());
  if (specific.length === 0) {
    return <span className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>Áp dụng cho mọi lựa chọn</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {specific.map((d) => (
        <span key={d.type} className="admin-badge" style={{ background: "var(--admin-primary-soft)", color: "var(--admin-primary)", borderColor: "rgba(8,51,125,0.18)" }}>
          {optionTypeLabel(d.type)}: {d.value}
        </span>
      ))}
    </div>
  );
}

function PriceCell({ rule }: { rule: PricingRule }) {
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>{formatVnd(rule.baseUnitPrice)}</p>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {rule.additionalCost > 0 && (
          <span className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>+{formatVnd(rule.additionalCost)}/đơn</span>
        )}
        {rule.discountPercent > 0 && (
          <span className="text-[10px]" style={{ color: "var(--admin-accent-strong)" }}>-{rule.discountPercent}%</span>
        )}
      </div>
    </div>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`admin-badge ${isActive ? "admin-badge-active" : "admin-badge-inactive"}`}>
      {isActive ? "Đang áp dụng" : "Đã tắt"}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

interface RuleRow extends PricingRule {
  productName: string;
  productActive: boolean;
}

export default function AdminPricingRulesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const [listNotice, setListNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const [pendingDelete, setPendingDelete] = useState<RuleRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadAll(tk: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const productsResult = await getProducts({ pageSize: 100, activeOnly: false }, tk);
      const productList = productsResult.items;
      setProducts(productList);

      // No "list all pricing rules" endpoint exists on the backend -- rules only ever make
      // sense scoped to one product's own material/size/printing-side catalog, so the workspace
      // fans out across the existing per-product endpoint instead of adding a new aggregate one.
      const perProduct = await Promise.all(
        productList.map((p) => getPricingRulesByProduct(p.id, tk)),
      );
      const merged: RuleRow[] = perProduct.flatMap((list, idx) =>
        list.map((r) => ({ ...r, productName: productList[idx].name, productActive: productList[idx].isActive })),
      );
      setRules(merged);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải danh sách quy tắc giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => loadAll(token), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rules
      .filter((r) => !productFilter || r.productId === productFilter)
      .filter((r) => {
        if (!term) return true;
        return (
          r.productName.toLowerCase().includes(term) ||
          (r.material ?? "").toLowerCase().includes(term) ||
          (r.size ?? "").toLowerCase().includes(term) ||
          (r.printingSide ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.productName.localeCompare(b.productName) || a.minQuantity - b.minQuantity);
  }, [rules, search, productFilter]);

  const summary = useMemo(() => {
    const activeCount = rules.filter((r) => r.isActive).length;
    const productCount = new Set(rules.map((r) => r.productId)).size;
    return { total: rules.length, activeCount, productCount };
  }, [rules]);

  const isFiltered = productFilter !== "" || search.trim().length > 0;

  function openCreate() {
    setFormMode("create");
    setEditingRule(null);
    setFormOpen(true);
  }

  function openEdit(rule: PricingRule) {
    setFormMode("edit");
    setEditingRule(rule);
    setFormOpen(true);
  }

  function handleSaved(notice: string) {
    setFormOpen(false);
    setListNotice({ type: "success", text: notice });
    if (token) loadAll(token);
  }

  async function handleToggleActive(rule: RuleRow) {
    if (!token) return;
    try {
      await updatePricingRule(rule.id, {
        material: rule.material, size: rule.size, printingSide: rule.printingSide,
        minQuantity: rule.minQuantity, maxQuantity: rule.maxQuantity,
        baseUnitPrice: rule.baseUnitPrice, additionalCost: rule.additionalCost, discountPercent: rule.discountPercent,
        isActive: !rule.isActive,
      }, token);
      setListNotice({ type: "success", text: rule.isActive ? `Đã tắt quy tắc của "${rule.productName}".` : `Đã bật lại quy tắc của "${rule.productName}".` });
      await loadAll(token);
    } catch (err) {
      setListNotice({ type: "error", text: err instanceof Error ? err.message : "Không thể cập nhật trạng thái." });
    }
  }

  async function handleDelete() {
    if (!token || !pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deletePricingRule(pendingDelete.id, token);
      const name = pendingDelete.productName;
      setPendingDelete(null);
      setListNotice({ type: "success", text: `Đã xóa quy tắc giá của "${name}".` });
      await loadAll(token);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Không thể xóa quy tắc. Vui lòng thử lại.");
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
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Quy tắc giá</p>
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
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>Quy tắc giá</h1>
          <p className="mt-1 text-sm max-w-[60ch]" style={{ color: "var(--admin-text-subtle)" }}>
            Cấu hình mức giá riêng theo số lượng, chất liệu, kích thước và số mặt in cho từng sản phẩm.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={products.length === 0}
          className={`${PRIMARY_BTN} shrink-0`}
          style={{ background: "var(--admin-primary)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Thêm quy tắc
        </button>
      </div>

      {/* Summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Tổng quy tắc</p>
          <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>{loading ? <span className="inline-block h-5 w-8 rounded admin-skeleton" /> : summary.total}</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Đang áp dụng</p>
          <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--admin-success)" }}>{loading ? <span className="inline-block h-5 w-8 rounded admin-skeleton" /> : summary.activeCount}</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>Sản phẩm có quy tắc</p>
          <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>{loading ? <span className="inline-block h-5 w-8 rounded admin-skeleton" /> : summary.productCount}</p>
        </div>
      </div>

      {/* Info note -- describes EXISTING tie-break behavior in PricingRuleRepository.FindBestMatchAsync,
          not a new feature: no duplicate/overlap validation exists today, so overlapping rules can be
          saved; at calculation time the most specific match wins, ties broken by higher discount. */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: "var(--admin-info-soft)", border: "1px solid rgba(8,51,125,0.14)" }}>
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--admin-info)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
          Hệ thống chưa tự động cảnh báo quy tắc trùng hoặc chồng chéo điều kiện — hãy kiểm tra kỹ trước khi lưu.
          Khi một đơn hàng khớp nhiều quy tắc, hệ thống tự động chọn quy tắc có <span className="font-medium">nhiều điều kiện cụ thể nhất</span> (chất liệu, kích thước, số mặt in);
          nếu vẫn bằng nhau, quy tắc có <span className="font-medium">mức giảm giá cao hơn</span> sẽ được áp dụng.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
        <div className="relative w-full sm:max-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-subtle)" }} />
          <input
            type="text"
            placeholder="Tìm theo sản phẩm, chất liệu, kích thước..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm quy tắc giá"
            className="admin-focus-ring h-9 w-full rounded-lg pl-8 pr-8 text-sm outline-none transition"
            style={{ background: "var(--admin-canvas)", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Xóa tìm kiếm" className="admin-focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded transition-colors" style={{ color: "var(--admin-text-subtle)" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          aria-label="Lọc theo sản phẩm"
          className="admin-focus-ring h-9 rounded-lg px-3 text-sm outline-none transition sm:max-w-[240px]"
          style={{ background: "var(--admin-canvas)", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text)" }}
        >
          <option value="">Tất cả sản phẩm</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
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
        <table className="w-full min-w-[760px] text-left" style={{ background: "var(--admin-surface)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}>
              {["Sản phẩm", "Điều kiện", "Giá", "Trạng thái", ""].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeleton />}
            {!loading && loadError && <tr><td colSpan={5}><ErrorBanner message={loadError} onRetry={() => token && loadAll(token)} /></td></tr>}
            {!loading && !loadError && filteredRules.length === 0 && (
              <tr><td colSpan={5}><EmptyState hasProducts={products.length > 0} filtered={isFiltered} /></td></tr>
            )}
            {!loading && !loadError && filteredRules.map((r) => (
              <tr key={r.id} className="transition-colors" style={{ borderBottom: "1px solid var(--admin-border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-primary-soft)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                <td className="px-4 py-3.5 max-w-[180px]">
                  <p className="truncate text-[13px] font-medium" style={{ color: "var(--admin-text)" }}>
                    {r.productName}
                    {!r.productActive && <span className="ml-1.5 admin-badge admin-badge-hidden">Đã ẩn</span>}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{formatQuantityRange(r.minQuantity, r.maxQuantity)}</p>
                </td>
                <td className="px-4 py-3.5 max-w-[220px]"><DimensionChips rule={r} /></td>
                <td className="px-4 py-3.5"><PriceCell rule={r} /></td>
                <td className="px-4 py-3.5"><ActiveBadge isActive={r.isActive} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleToggleActive(r)}
                      className="admin-focus-ring flex h-9 items-center justify-center rounded-lg border px-2.5 text-[11px] transition-all"
                      style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
                      aria-label={r.isActive ? `Tắt quy tắc của "${r.productName}"` : `Bật quy tắc của "${r.productName}"`}>
                      {r.isActive ? "Tắt" : "Bật"}
                    </button>
                    <button onClick={() => openEdit(r)}
                      className="admin-focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}
                      aria-label={`Sửa quy tắc của "${r.productName}"`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setPendingDelete(r); setDeleteError(null); }}
                      className="admin-focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
                      style={{ color: "var(--admin-text-subtle)" }}
                      aria-label={`Xóa quy tắc của "${r.productName}"`}>
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
        {!loading && loadError && <div className="rounded-xl" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}><ErrorBanner message={loadError} onRetry={() => token && loadAll(token)} /></div>}
        {!loading && !loadError && filteredRules.length === 0 && (
          <div className="rounded-xl" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
            <EmptyState hasProducts={products.length > 0} filtered={isFiltered} />
          </div>
        )}
        {!loading && !loadError && filteredRules.length > 0 && (
          <div className="space-y-3">
            {filteredRules.map((r) => (
              <div key={r.id} className="rounded-xl p-4" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>
                      {r.productName}
                      {!r.productActive && <span className="ml-1.5 admin-badge admin-badge-hidden">Đã ẩn</span>}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>{formatQuantityRange(r.minQuantity, r.maxQuantity)}</p>
                  </div>
                  <ActiveBadge isActive={r.isActive} />
                </div>
                <div className="mt-2.5"><DimensionChips rule={r} /></div>
                <div className="mt-3"><PriceCell rule={r} /></div>
                <div className="mt-3.5 grid grid-cols-3 gap-1.5">
                  <button onClick={() => handleToggleActive(r)}
                    className="admin-focus-ring flex min-h-[44px] items-center justify-center rounded-lg border text-[12px] transition-colors"
                    style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}>
                    {r.isActive ? "Tắt" : "Bật"}
                  </button>
                  <button onClick={() => openEdit(r)}
                    className="admin-focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ color: "var(--admin-primary)", background: "var(--admin-primary-soft)" }}>
                    <Pencil size={13} /> Sửa
                  </button>
                  <button onClick={() => { setPendingDelete(r); setDeleteError(null); }}
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

      {/* Refresh */}
      {!loading && !loadError && (
        <div className="mt-6 flex justify-end">
          <button onClick={() => token && loadAll(token)} className="admin-focus-ring rounded text-sm transition-colors hover:underline" style={{ color: "var(--admin-text-subtle)" }}>
            Làm mới
          </button>
        </div>
      )}

      {/* Create/Edit modal */}
      {token && (
        <RuleFormModal
          open={formOpen}
          mode={formMode}
          products={products}
          editingRule={editingRule}
          defaultProductId={productFilter || products[0]?.id || ""}
          token={token}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteRuleModal
        rule={pendingDelete}
        productName={pendingDelete?.productName ?? ""}
        busy={deleteBusy}
        error={deleteError}
        onCancel={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </div>
  );
}
