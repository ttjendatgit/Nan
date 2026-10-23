"use client";

// The quote request form, shared by the homepage (general inquiry) and the product detail page
// (product quote). It posts to the real API (createQuoteRequest) and shows the success state only
// after the server accepted the request; a failed request shows the server's message and keeps the
// form filled in. R10.4: brand tokens (DECISIONS §1, §5) instead of the pre-redesign blue palette;
// every label is tied to its control, errors are announced and tied to the field
// (aria-describedby), placeholders meet contrast, and the form says what a quote is based on.

import { useId, useState } from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { createQuoteRequest } from "@/lib/api/quoteRequests";
import type { CreateQuoteRequestInput } from "@/types/quote";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuoteRequestFormProps {
  productId?: string;
  productName?: string;
  categoryName?: string;
  minQuantity?: number;
  /** Pre-fills the quantity field, e.g. from a product option selector. Falls back to minQuantity. */
  initialQuantity?: number;
  /** IDs of ProductOption values selected in the configurator, if any. Sent as-is; the backend recalculates price server-side. */
  selectedOptionIds?: string[];
  /** Pre-fills "Ghi chú thêm", e.g. the word a visitor printed on the Hero fan. Editable. */
  initialMessage?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  /** id for the visible title, so a wrapping dialog can point aria-labelledby at it. */
  titleId?: string;
}

// ─── Internal form state ──────────────────────────────────────────────────────

interface FormFields {
  fullName: string;
  phone: string;
  email: string;
  companyName: string;
  quantity: string;
  neededDate: string;
  useCase: string;
  message: string;
}

type FieldErrors = Partial<Record<keyof FormFields, string>>;

function validate(f: FormFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!f.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
  if (!f.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    errors.email = "Email không hợp lệ";
  }
  const qty = parseInt(f.quantity, 10);
  if (!f.quantity || isNaN(qty) || qty < 1) {
    errors.quantity = "Số lượng phải lớn hơn 0";
  }
  return errors;
}

/** Shared control styles: borders at on-indigo-muted/60 meet 3:1 (DECISIONS §5). */
const CONTROL =
  "w-full rounded-md border bg-indigo-deep px-4 py-3 text-[0.9375rem] text-on-indigo placeholder:text-on-indigo-muted placeholder:italic transition-colors focus:outline-none focus-visible:ring-1";
const CONTROL_OK = "border-on-indigo-muted/60 focus-visible:border-bamboo focus-visible:ring-bamboo";
const CONTROL_ERROR = "border-danger focus-visible:border-danger focus-visible:ring-danger";

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuoteRequestForm({
  productId,
  productName,
  categoryName,
  minQuantity,
  initialQuantity,
  selectedOptionIds,
  initialMessage,
  onSuccess,
  onCancel,
  titleId,
}: QuoteRequestFormProps) {
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    quantity: String(initialQuantity ?? minQuantity ?? 1),
    neededDate: "",
    useCase: "",
    message: initialMessage ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const uid = useId();
  const idFor = (field: keyof FormFields) => `${uid}-${field}`;

  function update(field: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Take the reader to the first field that needs attention.
      const first = (Object.keys(errs) as (keyof FormFields)[])[0];
      document.getElementById(idFor(first))?.focus();
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const input: CreateQuoteRequestInput = {
        productId: productId || undefined,
        fullName: fields.fullName.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim() || undefined,
        companyName: fields.companyName.trim() || undefined,
        quantity: parseInt(fields.quantity, 10),
        neededDate: fields.neededDate || undefined,
        useCase: fields.useCase.trim() || undefined,
        message: fields.message.trim() || undefined,
        selectedOptionIds: selectedOptionIds?.length ? selectedOptionIds : undefined,
      };
      await createQuoteRequest(input);
      setSubmitted(true);
    } catch (err) {
      setApiError(
        err instanceof Error && err.message
          ? err.message
          : "Không thể gửi yêu cầu. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state (only after the API accepted the request) ────────────────
  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center justify-center gap-5 px-6 py-14 text-center">
        <CheckCircle aria-hidden="true" className="h-9 w-9 text-bamboo" strokeWidth={1.5} />
        <div>
          <p id={titleId} className="mb-2 font-serif text-2xl font-medium text-on-indigo">
            Yêu cầu đã được gửi
          </p>
          <p className="mx-auto max-w-[32ch] text-[0.9375rem] leading-7 text-on-indigo-muted">
            Nan đã nhận yêu cầu báo giá của bạn và sẽ liên hệ lại qua số điện thoại bạn để lại.
          </p>
        </div>
        <Button type="button" tone="indigo" variant="secondary" onClick={onSuccess}>
          Đóng
        </Button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line-on-indigo px-6 pb-4 pt-5">
        <div className="min-w-0">
          <h2 id={titleId} className="font-serif text-2xl font-medium leading-snug text-on-indigo">
            {productName ? `Nhận báo giá cho ${productName}` : "Gửi yêu cầu báo giá"}
          </h2>
          {categoryName && <p className="mt-1 text-sm text-on-indigo-muted">{categoryName}</p>}
          <p className="mt-2 max-w-md text-sm leading-6 text-on-indigo-muted">
            Báo giá dựa trên kiểu quạt, chất liệu, số lượng và yêu cầu hoàn thiện.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="-mr-2 -mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-on-indigo-muted transition-colors hover:text-on-indigo focus-visible:outline-2 focus-visible:outline-on-indigo"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable form body */}
      <form id="quote-form" onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 overflow-y-auto px-6 py-5" style={{ maxHeight: "min(58dvh, 480px)" }}>
          <FormField id={idFor("fullName")} label="Họ và tên" required error={errors.fullName}>
            <FormInput
              id={idFor("fullName")}
              type="text"
              value={fields.fullName}
              onChange={(v) => update("fullName", v)}
              required
              error={errors.fullName}
              autoComplete="name"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id={idFor("phone")} label="Số điện thoại" required error={errors.phone}>
              <FormInput
                id={idFor("phone")}
                type="tel"
                value={fields.phone}
                onChange={(v) => update("phone", v)}
                required
                error={errors.phone}
                autoComplete="tel"
              />
            </FormField>
            <FormField id={idFor("email")} label="Email" error={errors.email}>
              <FormInput
                id={idFor("email")}
                type="email"
                value={fields.email}
                onChange={(v) => update("email", v)}
                error={errors.email}
                autoComplete="email"
              />
            </FormField>
          </div>

          <FormField id={idFor("companyName")} label="Công ty / thương hiệu">
            <FormInput
              id={idFor("companyName")}
              type="text"
              value={fields.companyName}
              onChange={(v) => update("companyName", v)}
              autoComplete="organization"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id={idFor("quantity")}
              label="Số lượng"
              required
              error={errors.quantity}
              hint={minQuantity ? `Tối thiểu ${minQuantity} cái` : undefined}
            >
              <FormInput
                id={idFor("quantity")}
                type="number"
                inputMode="numeric"
                value={fields.quantity}
                onChange={(v) => update("quantity", v)}
                min="1"
                required
                error={errors.quantity}
                hint={minQuantity ? `Tối thiểu ${minQuantity} cái` : undefined}
              />
            </FormField>
            <FormField id={idFor("neededDate")} label="Ngày cần hàng">
              <FormInput
                id={idFor("neededDate")}
                type="date"
                value={fields.neededDate}
                onChange={(v) => update("neededDate", v)}
              />
            </FormField>
          </div>

          <FormField id={idFor("useCase")} label="Mục đích sử dụng">
            <FormInput
              id={idFor("useCase")}
              type="text"
              value={fields.useCase}
              onChange={(v) => update("useCase", v)}
              placeholder="Ví dụ: sự kiện khai trương, quà tặng khách, resort"
            />
          </FormField>

          <FormField id={idFor("message")} label="Ghi chú thêm">
            <textarea
              id={idFor("message")}
              value={fields.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Kiểu quạt, chất liệu, màu sắc. Nếu có logo hoặc artwork, hãy ghi chú để Nan liên hệ nhận file."
              rows={3}
              className={`${CONTROL} ${CONTROL_OK} resize-none leading-relaxed`}
            />
          </FormField>

          {/* API-level error: announced, with the next step */}
          {apiError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/60 px-4 py-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
              <p className="text-sm leading-relaxed text-danger">{apiError}</p>
            </div>
          )}
        </div>

        {/* Footer, always visible */}
        <div className="border-t border-line-on-indigo px-6 pb-6 pt-4">
          <Button type="submit" tone="indigo" disabled={submitting} aria-busy={submitting} className="w-full gap-2 py-3.5">
            {submitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {submitting ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-on-indigo-muted">
        {label}
        {required && (
          <span className="ml-1 text-bamboo" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-on-indigo-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm leading-tight text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input primitive ───────────────────────────────────────────────────────────

function FormInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  min,
  inputMode,
  autoComplete,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  min?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      inputMode={inputMode}
      required={required}
      aria-required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      autoComplete={autoComplete}
      className={`${CONTROL} ${error ? CONTROL_ERROR : CONTROL_OK} ${type === "date" ? "[color-scheme:dark]" : ""}`}
    />
  );
}
