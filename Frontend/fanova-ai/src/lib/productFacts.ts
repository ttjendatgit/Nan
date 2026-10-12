/**
 * R9D: the one place that turns a product's commercial fields into public label/value pairs, used
 * by both the catalogue (/products?categoryId=) and the product detail page so they always say the
 * same thing. Values come straight from the API (`Product`); nothing here invents data.
 *
 * Schema facts (Backend Product entity + validators):
 * - basePrice: decimal >= 0, never null. 0 = no list price (priced per request / pricing rules).
 * - minQuantity: int > 0 (validator), default 1. Anything else is treated as "not set".
 * - estimatedProductionDays: int >= 0, entity default 0, not read by any business logic.
 *   0 = not configured (there is no same-day rule), so it renders the contact fallback.
 * - isCustomizable: bool, never null.
 * A value that is missing, not finite, or out of range never reaches the page as
 * "0", "NaN", "undefined" or "null": it falls back to the wording below.
 */

import type { Product } from "@/types/catalog";

export interface ProductFact {
  label: string;
  value: string;
  /** Price and MOQ read a step stronger than the rest. */
  strong?: boolean;
}

/** Shown when a commercial value is not set: the buyer asks Nan. */
export const CONTACT_FALLBACK = "Liên hệ";
/** Shown when there is no list price: priced per request (catalogue and detail alike). */
export const PRICE_ON_REQUEST = "Báo giá theo yêu cầu";

const vnNumber = (n: number) => n.toLocaleString("vi-VN");
const isPositive = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

export function formatProductPrice(basePrice: number | null | undefined): ProductFact {
  return isPositive(basePrice)
    ? { label: "Giá từ", value: `${vnNumber(basePrice)} đ`, strong: true }
    : { label: "Giá", value: PRICE_ON_REQUEST, strong: true };
}

export function formatCustomization(isCustomizable: boolean | null | undefined): ProductFact {
  return {
    label: "Tùy chỉnh",
    value: isCustomizable === true ? "Có" : isCustomizable === false ? "Không" : CONTACT_FALLBACK,
  };
}

export function formatMinimumQuantity(minQuantity: number | null | undefined): ProductFact {
  return {
    label: "SL tối thiểu",
    value: isPositive(minQuantity) ? `${vnNumber(Math.round(minQuantity))} cái` : CONTACT_FALLBACK,
    strong: true,
  };
}

export function formatProductionTime(days: number | null | undefined): ProductFact {
  return {
    label: "Thời gian sản xuất",
    value: isPositive(days) ? `${vnNumber(Math.round(days))} ngày` : CONTACT_FALLBACK,
  };
}

/** Catalogue rows: the three facts a buyer compares across a line, always in this order. */
export function catalogueFacts(p: Pick<Product, "basePrice" | "isCustomizable" | "minQuantity">): ProductFact[] {
  return [formatProductPrice(p.basePrice), formatCustomization(p.isCustomizable), formatMinimumQuantity(p.minQuantity)];
}

/** Product detail: the same three, plus production time. */
export function detailFacts(
  p: Pick<Product, "basePrice" | "isCustomizable" | "minQuantity" | "estimatedProductionDays">,
): ProductFact[] {
  return [...catalogueFacts(p), formatProductionTime(p.estimatedProductionDays)];
}
