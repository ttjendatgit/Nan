"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createQuoteRequest } from "@/lib/api/quoteRequests";
import type { CreateQuoteRequestInput } from "@/types/quote";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuoteRequestFormProps {
  productId?: string;
  productName?: string;
  categoryName?: string;
  minQuantity?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuoteRequestForm({
  productId,
  productName,
  categoryName,
  minQuantity,
  onSuccess,
  onCancel,
}: QuoteRequestFormProps) {
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    quantity: String(minQuantity ?? 1),
    neededDate: "",
    useCase: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function update(field: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
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
      };
      await createQuoteRequest(input);
      setSubmitted(true);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Không thể gửi yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 px-6 py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-[#273481]/15 border border-[#273481]/35 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-[#B6D6F2]" />
        </div>
        <div>
          <p className="text-base font-semibold text-white mb-2">
            Yêu cầu đã được gửi
          </p>
          <p className="text-sm text-[#B6D6F2]/55 leading-relaxed max-w-[28ch] mx-auto">
            Yêu cầu báo giá đã được gửi. Nan sẽ liên hệ lại với bạn sớm.
          </p>
        </div>
        <button
          onClick={onSuccess}
          className="mt-1 rounded-full border border-[#273481]/50 px-6 py-2.5 text-sm font-medium text-[#B6D6F2] hover:border-[#273481] hover:text-white transition-all active:scale-[0.98]"
        >
          Đóng
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1B1C4A]">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-white leading-snug truncate">
            {productName
              ? `Nhận báo giá cho ${productName}`
              : "Gửi yêu cầu báo giá"}
          </h2>
          {categoryName && (
            <p className="mt-1 text-xs text-[#B6D6F2]/40">{categoryName}</p>
          )}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="flex-shrink-0 p-1.5 -mt-0.5 -mr-1 rounded-lg text-[#B6D6F2]/40 hover:text-white hover:bg-[#1B1C4A] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scrollable form body */}
      <form id="quote-form" onSubmit={handleSubmit} noValidate>
        <div className="overflow-y-auto px-6 py-5 space-y-4"
             style={{ maxHeight: "min(58dvh, 460px)" }}>

          {/* Full name */}
          <FormField label="Họ và tên" required error={errors.fullName}>
            <FormInput
              type="text"
              value={fields.fullName}
              onChange={(v) => update("fullName", v)}
              placeholder="Nguyễn Văn An"
              required
              hasError={!!errors.fullName}
              autoComplete="name"
            />
          </FormField>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Số điện thoại" required error={errors.phone}>
              <FormInput
                type="tel"
                value={fields.phone}
                onChange={(v) => update("phone", v)}
                placeholder="0901 234 567"
                required
                hasError={!!errors.phone}
                autoComplete="tel"
              />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <FormInput
                type="email"
                value={fields.email}
                onChange={(v) => update("email", v)}
                placeholder="an@company.vn"
                hasError={!!errors.email}
                autoComplete="email"
              />
            </FormField>
          </div>

          {/* Company name */}
          <FormField label="Công ty / thương hiệu">
            <FormInput
              type="text"
              value={fields.companyName}
              onChange={(v) => update("companyName", v)}
              placeholder="Tên công ty hoặc thương hiệu"
              autoComplete="organization"
            />
          </FormField>

          {/* Quantity + Needed date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Số lượng"
              required
              error={errors.quantity}
              hint={minQuantity ? `Tối thiểu ${minQuantity} cái` : undefined}
            >
              <FormInput
                type="number"
                value={fields.quantity}
                onChange={(v) => update("quantity", v)}
                placeholder="300"
                min="1"
                required
                hasError={!!errors.quantity}
              />
            </FormField>
            <FormField label="Ngày cần hàng">
              <FormInput
                type="date"
                value={fields.neededDate}
                onChange={(v) => update("neededDate", v)}
                isDate
              />
            </FormField>
          </div>

          {/* Use case */}
          <FormField label="Mục đích sử dụng">
            <FormInput
              type="text"
              value={fields.useCase}
              onChange={(v) => update("useCase", v)}
              placeholder="Sự kiện thương hiệu, wedding, resort..."
            />
          </FormField>

          {/* Message */}
          <FormField label="Ghi chú thêm">
            <textarea
              value={fields.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Yêu cầu về chất liệu, màu sắc, thiết kế..."
              rows={3}
              className="w-full rounded-xl bg-[#0A0F1E] border border-[#1B1C4A] px-4 py-3 text-sm text-white placeholder-[#B6D6F2]/22 focus:outline-none focus:border-[#273481] transition-colors resize-none leading-relaxed"
            />
          </FormField>

          {/* API-level error */}
          {apiError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/18 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-relaxed">{apiError}</p>
            </div>
          )}
        </div>

        {/* Footer — always visible */}
        <div className="px-6 pb-6 pt-4 border-t border-[#1B1C4A]">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#273481] py-3.5 text-sm font-semibold text-white hover:bg-[#273481]/90 disabled:opacity-55 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#B6D6F2]/60">
        {label}
        {required && (
          <span className="ml-1 text-[#B6D6F2]/30" aria-hidden="true">*</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-[#B6D6F2]/28">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-red-400 leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input primitive ───────────────────────────────────────────────────────────

function FormInput({
  type,
  value,
  onChange,
  placeholder,
  required,
  hasError,
  isDate,
  min,
  autoComplete,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  isDate?: boolean;
  min?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      required={required}
      aria-required={required}
      aria-invalid={hasError || undefined}
      autoComplete={autoComplete}
      className={[
        "w-full rounded-xl bg-[#0A0F1E] border px-4 py-3 text-sm text-white",
        "placeholder-[#B6D6F2]/22 focus:outline-none transition-colors",
        isDate ? "[color-scheme:dark] text-[#B6D6F2]/55" : "",
        hasError
          ? "border-red-500/45 focus:border-red-400"
          : "border-[#1B1C4A] focus:border-[#273481]",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
