"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  PRODUCT_OPTION_GROUPS,
  REQUIRED_GROUP_IDS,
  DEFAULT_QUANTITY_FALLBACK,
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

  const selectedSizeId = selected.size?.[0];

  // items-start removed deliberately: with a Grid default of align-items:
  // stretch, this sticky column's own box stretches to the full row height
  // (matching the taller option-groups column), giving position:sticky the
  // room it needs to stay pinned through the scroll. With items-start, the
  // sticky wrapper's box shrank to just its content height and the summary
  // "ran out" of containing block within the first ~150px of scroll. The
  // inner card keeps its natural compact height regardless; only the
  // invisible outer wrapper stretches.
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">

      {/* Option groups -- wide two-column editorial grid, not a narrow stack */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#0F1320]">
          Cấu hình sản phẩm
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[rgba(15,19,32,0.60)]">
          Chọn thông số để Nan tư vấn cấu hình và báo giá phù hợp hơn.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-9 border-t border-[rgba(15,19,32,0.14)] pt-8 sm:grid-cols-2">
          {PRODUCT_OPTION_GROUPS.map((group, index) => (
            <OptionGroupField
              key={group.id}
              stepNumber={index + 1}
              group={group}
              selectedIds={selected[group.id] ?? []}
              selectedSizeId={selectedSizeId}
              onToggle={(valueId) => toggleValue(group.id, valueId, group.multiSelect)}
            />
          ))}
        </div>

        {/* Quantity -- full width, larger touch targets */}
        <div className="mt-9 border-t border-[rgba(15,19,32,0.14)] pt-8">
          <GroupLabel stepNumber={PRODUCT_OPTION_GROUPS.length + 1} title="Số lượng" required />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => commitQuantity(quantity - QUANTITY_STEP)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[rgba(15,19,32,0.20)] text-[#0F1320] transition hover:border-[#192B88] hover:text-[#192B88]"
            >
              <span aria-hidden="true" className="text-lg leading-none">&#8722;</span>
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
              className="w-32 rounded-md border border-[rgba(15,19,32,0.20)] bg-transparent px-3 py-2.5 text-center text-base font-semibold text-[#0F1320] outline-none transition focus:border-[#192B88]"
            />
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => commitQuantity(quantity + QUANTITY_STEP)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[rgba(15,19,32,0.20)] text-[#0F1320] transition hover:border-[#192B88] hover:text-[#192B88]"
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
            </button>
            <span className="text-xs text-[rgba(15,19,32,0.50)]">Tối thiểu {minQuantity} cái</span>
          </div>
        </div>
      </div>

      {/* Summary + estimate -- the ONLY sticky element, compact, dark surface
          as a deliberate accent within the light configurator section.
          top-32 (128px) clears the fixed announcement-bar + Navbar stack
          (measured 112.5px) with a visible margin, not a guessed value.

          Two nested divs, deliberately: this outer one is the grid item and
          stretches to the row's full height (matching the taller
          option-groups column) via the grid's default align-items:stretch --
          that's the "room to travel" position:sticky needs. The INNER div
          carries the sticky positioning itself and keeps its own natural
          (short) content height. Putting sticky directly on the stretched
          grid item was the bug: an element that's already exactly as tall as
          its own containing block has nowhere to move, so it never visually
          stuck -- confirmed at runtime (its top tracked the grid's top in
          exact 1:1 lockstep with scroll, at every scroll position tested). */}
      <div>
      <div className="lg:sticky lg:top-32">
        <div className="rounded-lg border border-[#192B88]/25 bg-[#0F1320] p-4">
          <h3 className="font-serif text-lg font-semibold text-[#F1F0EA]">Tóm tắt cấu hình</h3>

          <div className="mt-2.5">
          <SummaryList group={PRODUCT_OPTION_GROUPS[0]} selectedIds={selected.size ?? []} selectedSizeId={selectedSizeId} />
          <SummaryList group={PRODUCT_OPTION_GROUPS[1]} selectedIds={selected.material ?? []} selectedSizeId={selectedSizeId} />
          <SummaryList group={PRODUCT_OPTION_GROUPS[2]} selectedIds={selected.printSides ?? []} selectedSizeId={selectedSizeId} />
          <SummaryList group={PRODUCT_OPTION_GROUPS[3]} selectedIds={selected.backSide ?? []} selectedSizeId={selectedSizeId} />
          <SummaryList group={PRODUCT_OPTION_GROUPS[4]} selectedIds={selected.ribType ?? []} selectedSizeId={selectedSizeId} />
          <SummaryList group={PRODUCT_OPTION_GROUPS[5]} selectedIds={selected.logoAccessories ?? []} selectedSizeId={selectedSizeId} />
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-sm">
            <span className="text-[#F1F0EA]/60">Số lượng</span>
            <span className="font-semibold text-[#F1F0EA]">{quantity.toLocaleString("vi-VN")} cái</span>
          </div>

          {/* Estimate */}
          <div className="mt-2.5 border-t border-white/10 pt-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#F1F0EA]/40">
              Ước tính
            </p>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-[#F1F0EA]/60">Giá tham khảo / cái</span>
              <span className="font-medium text-[#F1F0EA]">{hasPrice ? formatCurrency(unitPrice) : "Cần báo giá"}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5">
              <span className="text-sm text-[#F1F0EA]/70">Tạm tính</span>
              <span className="text-lg font-bold text-[#F1F0EA]">
                {hasPrice ? formatCurrency(subtotal) : "Cần báo giá"}
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-[11px] leading-snug text-[#F1F0EA]/40">
            Giá hiển thị chỉ mang tính tham khảo. Vui lòng gửi yêu cầu để Nan tư vấn và báo giá chính xác theo thiết kế,
            chất liệu và số lượng thực tế.
          </p>

          {validationError && (
            <div role="alert" className="mt-2.5 flex items-start gap-2.5 rounded-md border border-red-500/30 bg-red-500/10 px-3.5 py-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-300">{validationError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleRequestQuote}
            className="mt-3 w-full rounded-md bg-[#192B88] py-3 text-sm font-semibold text-[#F1F0EA] transition-all hover:bg-[#F1F0EA] hover:text-[#0F1320] active:scale-[0.98]"
          >
            Yêu cầu báo giá chính xác
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Option group field ─────────────────────────────────────────────────────

function GroupLabel({ stepNumber, title, required }: { stepNumber: number; title: string; required: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-xs font-semibold text-[#192B88]">
        {String(stepNumber).padStart(2, "0")}
      </span>
      <h3 className="font-serif text-lg font-semibold text-[#0F1320]">{title}</h3>
      {required ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.10em] text-[rgba(15,19,32,0.45)]">
          Bắt buộc
        </span>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-[0.10em] text-[rgba(15,19,32,0.32)]">
          Tùy chọn
        </span>
      )}
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
      <GroupLabel stepNumber={stepNumber} title={group.title} required={group.required} />
      <div className="mt-4 flex flex-wrap gap-2">
        {group.values.map((value) => {
          const isSelected = selectedIds.includes(value.id);
          const delta = resolveDelta(value, selectedSizeId);
          return (
            <button
              key={value.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value.id)}
              className={`flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-medium transition ${
                isSelected
                  ? "border-[#192B88] bg-[#192B88] text-[#F1F0EA]"
                  : "border-[rgba(15,19,32,0.18)] bg-transparent text-[rgba(15,19,32,0.75)] hover:border-[#192B88]/50 hover:text-[#0F1320]"
              }`}
            >
              {value.label}
              {delta > 0 && (
                <span className={isSelected ? "text-[#F1F0EA]/65" : "text-[rgba(15,19,32,0.40)]"}>
                  +{(delta / 1000).toLocaleString("vi-VN")}k
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Summary row (only rendered once a value is selected) ──────────────────

function SummaryList({
  group,
  selectedIds,
  selectedSizeId,
}: {
  group: (typeof PRODUCT_OPTION_GROUPS)[number];
  selectedIds: string[];
  selectedSizeId: string | undefined;
}) {
  if (selectedIds.length === 0) return null;
  const items = selectedIds
    .map((id) => group.values.find((v) => v.id === id))
    .filter((v): v is (typeof group.values)[number] => Boolean(v));
  if (items.length === 0) return null;

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2 text-sm last:border-b-0">
      <span className="text-[#F1F0EA]/50">{group.title}</span>
      <span className="text-right font-medium text-[#F1F0EA]">
        {items.map((v, i) => {
          const delta = resolveDelta(v, selectedSizeId);
          return (
            <span key={v.id}>
              {v.label}
              {delta > 0 && <span className="text-[#F1F0EA]/45"> (+{formatCurrency(delta)})</span>}
              {i < items.length - 1 ? ", " : ""}
            </span>
          );
        })}
      </span>
    </div>
  );
}
