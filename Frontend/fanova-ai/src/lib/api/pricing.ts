import type { CatalogApiResponse } from "@/types/catalog";
import type { CalculatePriceInput, PriceBreakdown } from "@/types/pricing";
import { apiFetch } from "./client";

/**
 * POST /api/pricing/calculate — the single source of truth for price. Public, no auth required.
 * The frontend never computes a price itself; every displayed number comes from this call.
 */
export async function calculatePrice(input: CalculatePriceInput): Promise<PriceBreakdown> {
  const res = await apiFetch<CatalogApiResponse<PriceBreakdown>>("/api/pricing/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}
