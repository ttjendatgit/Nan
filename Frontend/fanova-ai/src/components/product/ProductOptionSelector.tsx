"use client";

import { useState } from "react";
import { AlertCircle, Check, Minus, Plus } from "lucide-react";
import {
  PRODUCT_OPTION_GROUPS,
  REQUIRED_GROUP_IDS,
  DEFAULT_QUANTITY_FALLBACK,
  calculateAddOns,
  calculateUnitPrice,
  buildOptionSummaryText,
  formatCurrency,
  resolveDelta,
  type SelectedOptions,
} from "@/lib/product-options";
import type { Product } from "@/types/catalog";

interface ProductOptionSelectorProps {
  product: Product;
  /** Called once required options + minimum quantity validate successfully. */
  onRequestQuote: (summaryText: string, quantity: number) => void;
}

const QUANTITY_STEP = 50;

export default function ProductOptionSelector({ product, onRequestQuote }: ProductOptionSelectorProps) {
  const minQuantity = product.minQuantity > 0 ? product.minQuantity : 1;
  const [selected, setSelected] = useState<SelectedOptions>({});
  const [quantity, setQuantity] = useState<number>(
    product.minQuantity > 0 ? product.minQuantity : DEFAULT_QUANTITY_FALLBACK,
  );
  const [quantityInput, setQuantityInput] = useState<string>(String(quantity));
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasPrice = product.basePrice > 0;
  const addOns = calculateAddOns(selected);
  const unitPrice = hasPrice ? calculateUnitPrice(product.basePrice, selected) : 0;
  const subtotal = hasPrice ? unitPrice * quantity : 0;

  function toggleValue(groupId: string, valueId: string, multiSelect: boolean) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (multiSelect) {
        const next = current.includes(valueId)
          ? current.filter((id) => id !== valueId)
          : [...current, valueId];
        return { ...prev, [groupId]: next };
      }
      const next = current[0] === valueId ? [] : [valueId];
      return { ...prev, [groupId]: next };
    });
    if (validationError) setValidationError(null);
  }

  function commitQuantity(next: number) {
    const clamped = Math.max(minQuantity, next);
    setQuantity(clamped);
    setQuantityInput(String(clamped));
    if (validationError) setValidationError(null);
  }

  function handleRequestQuote() {
    const missingRequired = REQUIRED_GROUP_IDS.some((id) => (selected[id] ?? []).length === 0);
    if (missingRequired) {
      setValidationError("Vui lòng chọn đầy đủ thông số bắt buộc trước khi gửi yêu cầu báo giá.");
      return;
    }
    if (quantity < minQuantity) {
      setValidationError(`Số lượng tối thiểu là ${minQuantity} cái.`);
      return;
    }
    const summary = buildOptionSummaryText({
      productName: product.name,
      quantity,
      selected,
      basePrice: product.basePrice,
    });
    onRequestQuote(summary, quantity);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#061047] p-6" style={{ boxShadow: "0 24px 60px -20px rgba(2,7,36,0.7)" }}>
      <h2 className="text-lg font-semibold text-white tracking-tight">Chọn thông số sản phẩm</h2>
      <p className="mt-1.5 text-sm text-white/55 leading-relaxed">
        Tùy chọn giúp Nan tư vấn cấu hình và báo giá phù hợp hơn.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {PRODUCT_OPTION_GROUPS.map((group, index) => (
          <OptionGroupField
            key={group.id}
            stepNumber={index + 1}
            group={group}
            selectedIds={selected[group.id] ?? []}
            selectedSizeId={selected.size?.[0]}
            onToggle={(valueId) => toggleValue(group.id, valueId, group.multiSelect)}
          />
        ))}

        {/* Group 7: Số lượng */}
        <div>
          <StepLabel stepNumber={PRODUCT_OPTION_GROUPS.length + 1} title="Số lượng" required />
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => commitQuantity(quantity - QUANTITY_STEP)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              <Minus size={16} />
            </button>
            <label className="sr-only" htmlFor="product-option-quantity">
              Số lượng
            </label>
            <input
              id="product-option-quantity"
              type="number"
              min={minQuantity}
              step={QUANTITY_STEP}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              onBlur={() => commitQuantity(parseInt(quantityInput, 10) || minQuantity)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-center text-sm font-semibold text-white outline-none transition focus:border-white/30"
            />
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => commitQuantity(quantity + QUANTITY_STEP)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-white/40">Tối thiểu {minQuantity} cái</p>
        </div>
      </div>

      {/* Pricing summary */}
      <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/55">Giá tham khảo / cái</span>
          <span className="font-semibold text-white">{hasPrice ? formatCurrency(unitPrice) : "Cần báo giá"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-white/55">Số lượng</span>
          <span className="font-semibold text-white">{quantity.toLocaleString("vi-VN")} cái</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
          <span className="text-white/70">Tạm tính</span>
          <span className="text-base font-bold text-[#FFD014]">
            {hasPrice ? formatCurrency(subtotal) : "Cần báo giá"}
          </span>
        </div>

        {addOns.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
              Phụ thu tham khảo
            </p>
            <ul className="flex flex-col gap-1">
              {addOns.map(({ group, value, delta }) => (
                <li key={`${group.id}-${value.id}`} className="flex items-center justify-between text-xs text-white/55">
                  <span>{value.label}</span>
                  <span className="text-white/70">+{formatCurrency(delta)}/cái</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-white/40">
        Giá hiển thị chỉ mang tính tham khảo. Vui lòng gửi yêu cầu để Nan tư vấn và báo giá chính xác theo thiết kế,
        chất liệu và số lượng thực tế.
      </p>

      {validationError && (
        <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs leading-relaxed text-red-300">{validationError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleRequestQuote}
        className="mt-5 w-full rounded-full bg-[#FFD014] py-3.5 text-sm font-semibold text-[#061047] transition-all hover:bg-[#F2C500] active:scale-[0.98]"
        style={{ boxShadow: "0 10px 26px -10px rgba(255,208,20,0.45)" }}
      >
        Yêu cầu báo giá chính xác
      </button>
    </div>
  );
}

// ─── Option group field ─────────────────────────────────────────────────────

function StepLabel({ stepNumber, title, required }: { stepNumber: number; title: string; required: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFD014] text-[11px] font-bold text-[#061047]">
        {stepNumber}
      </span>
      <p className="text-sm font-semibold text-white">
        {title}
        {required && <span className="ml-1 text-[#FFD014]">*</span>}
      </p>
    </div>
  );
}

function OptionGroupField({
  stepNumber,
  group,
  selectedIds,
  selectedSizeId,
  onToggle,
}: {
  stepNumber: number;
  group: (typeof PRODUCT_OPTION_GROUPS)[number];
  selectedIds: string[];
  selectedSizeId: string | undefined;
  onToggle: (valueId: string) => void;
}) {
  return (
    <div>
      <StepLabel stepNumber={stepNumber} title={group.title} required={group.required} />
      <div className="flex flex-wrap gap-2">
        {group.values.map((value) => {
          const isSelected = selectedIds.includes(value.id);
          const delta = resolveDelta(value, selectedSizeId);
          return (
            <button
              key={value.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                isSelected
                  ? "border-transparent bg-[#FFD014] text-[#061047]"
                  : "border-white/15 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {isSelected && <Check size={13} />}
              {value.label}
              {delta > 0 && !isSelected && (
                <span className="text-white/35">+{(delta / 1000).toLocaleString("vi-VN")}k</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
