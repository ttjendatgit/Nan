"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { getProductOptionGroups } from "@/lib/api/productOptions";
import { calculatePrice } from "@/lib/api/pricing";
import { formatVnd } from "@/lib/format";
import { optionTypeLabel as groupLabel } from "@/lib/optionTypes";
import type { Product, ProductOptionGroup } from "@/types/catalog";
import type { PriceBreakdown } from "@/types/pricing";

interface ProductOptionSelectorProps {
  product: Product;
  /** Called once quantity validates successfully. Options are optional -- there is no per-group "required" flag yet. */
  onRequestQuote: (selectedOptionIds: string[], quantity: number) => void;
}

const QUANTITY_STEP = 50;

function adjustmentSuffix(type: string): string {
  if (type === "FixedPerOrder") return "/đơn";
  if (type === "FixedPerUnit") return "/cái";
  return "";
}

export default function ProductOptionSelector({ product, onRequestQuote }: ProductOptionSelectorProps) {
  const minQuantity = product.minQuantity > 0 ? product.minQuantity : 1;

  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Single-select per OptionType group: no per-group "required"/"allow multiple" flag exists yet
  // (see PRODUCT_ARCHITECTURE audit -- deliberately not built until a real need proves it out).
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(minQuantity);
  const [quantityInput, setQuantityInput] = useState<string>(String(minQuantity));
  const [validationError, setValidationError] = useState<string | null>(null);

  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Load real per-product options from the database. No hardcoded fallback --
  // a product with zero configured options simply shows no option groups.
  useEffect(() => {
    let cancelled = false;
    // Deferred one tick so the loading-state setters below run inside a
    // callback rather than synchronously in the effect body -- same pattern
    // as the pricing effect further down (setTimeout(..., 300)), just with
    // no artificial delay since there's nothing to debounce here.
    const timer = window.setTimeout(() => {
      setGroupsLoading(true);
      getProductOptionGroups(product.id)
        .then((grouped) => {
          if (cancelled) return;
          setGroups(grouped.groups);
        })
        .catch(() => {
          if (cancelled) return;
          setGroups([]);
        })
        .finally(() => {
          if (!cancelled) setGroupsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [product.id]);

  // Backend is the sole pricing authority: every price shown here comes from
  // POST /api/pricing/calculate, debounced on quantity/selection change.
  useEffect(() => {
    if (groupsLoading) return;
    let cancelled = false;
    const selectedOptionIds = Object.values(selected);

    const timer = window.setTimeout(() => {
      setPricingLoading(true);
      setPricingError(null);
      calculatePrice({ productId: product.id, quantity, selectedOptionIds })
        .then((result) => {
          if (cancelled) return;
          setBreakdown(result);
        })
        .catch((err) => {
          if (cancelled) return;
          setBreakdown(null);
          setPricingError(err instanceof Error ? err.message : "Không thể tính giá.");
        })
        .finally(() => {
          if (!cancelled) setPricingLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [product.id, quantity, selected, groupsLoading]);

  function toggleValue(optionType: string, optionId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[optionType] === optionId) {
        delete next[optionType];
      } else {
        next[optionType] = optionId;
      }
      return next;
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
    if (quantity < minQuantity) {
      setValidationError(`Số lượng tối thiểu là ${minQuantity} cái.`);
      return;
    }
    onRequestQuote(Object.values(selected), quantity);
  }

  const hasOptions = groups.length > 0;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">

      {/* Option groups -- rendered entirely from live backend data */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#0F1320]">
          Cấu hình sản phẩm
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[rgba(15,19,32,0.60)]">
          Chọn thông số để Nan tư vấn cấu hình và báo giá phù hợp hơn.
        </p>

        {groupsLoading ? (
          <div className="mt-9 flex items-center gap-2 border-t border-[rgba(15,19,32,0.14)] pt-8 text-sm text-[rgba(15,19,32,0.45)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải tùy chọn...
          </div>
        ) : hasOptions ? (
          <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-9 border-t border-[rgba(15,19,32,0.14)] pt-8 sm:grid-cols-2">
            {groups.map((group, index) => (
              <OptionGroupField
                key={group.optionType}
                stepNumber={index + 1}
                group={group}
                selectedId={selected[group.optionType]}
                onToggle={(optionId) => toggleValue(group.optionType, optionId)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-9 border-t border-[rgba(15,19,32,0.14)] pt-8 text-sm text-[rgba(15,19,32,0.45)]">
            Sản phẩm này chưa có tùy chọn cấu hình riêng. Bạn có thể gửi yêu cầu báo giá trực tiếp.
          </p>
        )}

        {/* Quantity */}
        <div className="mt-9 border-t border-[rgba(15,19,32,0.14)] pt-8">
          <GroupLabel title="Số lượng" />
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

      {/* Summary + live pricing -- every number here comes from the backend */}
      <div>
      <div className="lg:sticky lg:top-32">
        <div className="rounded-lg border border-[#192B88]/25 bg-[#0F1320] p-4">
          <h3 className="font-serif text-lg font-semibold text-[#F1F0EA]">Tóm tắt cấu hình</h3>

          <div className="mt-2.5">
            {groups.map((group) => {
              const optionId = selected[group.optionType];
              const option = group.options.find((o) => o.id === optionId);
              if (!option) return null;
              return (
                <div
                  key={group.optionType}
                  className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2 text-sm last:border-b-0"
                >
                  <span className="text-[#F1F0EA]/50">{groupLabel(group.optionType)}</span>
                  <span className="text-right font-medium text-[#F1F0EA]">
                    {option.optionValue}
                    {option.additionalPrice > 0 && (
                      <span className="text-[#F1F0EA]/45">
                        {" "}(+{formatVnd(option.additionalPrice)}{adjustmentSuffix(option.priceAdjustmentType)})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-sm">
            <span className="text-[#F1F0EA]/60">Số lượng</span>
            <span className="font-semibold text-[#F1F0EA]">{quantity.toLocaleString("vi-VN")} cái</span>
          </div>

          {/* Live backend-calculated estimate */}
          <div className="mt-2.5 border-t border-white/10 pt-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#F1F0EA]/40">
              Ước tính
            </p>

            {pricingLoading && (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-[#F1F0EA]/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tính giá...
              </div>
            )}

            {!pricingLoading && pricingError && (
              <p className="mt-1.5 text-xs text-red-400/90">{pricingError}</p>
            )}

            {!pricingLoading && !pricingError && breakdown && (
              <>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-[#F1F0EA]/60">Giá tham khảo / cái</span>
                  <span className="font-medium text-[#F1F0EA]">{formatVnd(breakdown.unitPrice)}</span>
                </div>
                {breakdown.orderAdjustmentsTotal > 0 && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[#F1F0EA]/45">Phí theo đơn</span>
                    <span className="text-[#F1F0EA]/70">{formatVnd(breakdown.orderAdjustmentsTotal)}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5">
                  <span className="text-sm text-[#F1F0EA]/70">Tạm tính</span>
                  <span className="text-lg font-bold text-[#F1F0EA]">
                    {formatVnd(breakdown.calculatedTotal)}
                  </span>
                </div>
              </>
            )}
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

function GroupLabel({ stepNumber, title }: { stepNumber?: number; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      {stepNumber !== undefined && (
        <span className="font-mono text-xs font-semibold text-[#192B88]">
          {String(stepNumber).padStart(2, "0")}
        </span>
      )}
      <h3 className="font-serif text-lg font-semibold text-[#0F1320]">{title}</h3>
      <span className="text-[10px] font-medium uppercase tracking-[0.10em] text-[rgba(15,19,32,0.32)]">
        Tùy chọn
      </span>
    </div>
  );
}

function OptionGroupField({
  stepNumber,
  group,
  selectedId,
  onToggle,
}: {
  stepNumber: number;
  group: ProductOptionGroup;
  selectedId: string | undefined;
  onToggle: (optionId: string) => void;
}) {
  return (
    <div>
      <GroupLabel stepNumber={stepNumber} title={groupLabel(group.optionType)} />
      <div className="mt-4 flex flex-wrap gap-2">
        {group.options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option.id)}
              className={`flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-medium transition ${
                isSelected
                  ? "border-[#192B88] bg-[#192B88] text-[#F1F0EA]"
                  : "border-[rgba(15,19,32,0.18)] bg-transparent text-[rgba(15,19,32,0.75)] hover:border-[#192B88]/50 hover:text-[#0F1320]"
              }`}
            >
              {option.optionValue}
              {option.additionalPrice > 0 && (
                <span className={isSelected ? "text-[#F1F0EA]/65" : "text-[rgba(15,19,32,0.40)]"}>
                  +{(option.additionalPrice / 1000).toLocaleString("vi-VN")}k
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
