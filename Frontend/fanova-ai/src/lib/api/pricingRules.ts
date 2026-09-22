import type { CatalogApiResponse } from "@/types/catalog";
import type { CreatePricingRuleInput, PricingRule, UpdatePricingRuleInput } from "@/types/pricing";
import { apiFetch, getAuthHeaders } from "./client";

/**
 * GET /api/pricing-rules/product/{productId} — every pricing rule for one product, active and
 * inactive alike (the backend never filters by IsActive on this admin listing). Requires
 * Manager token. There is no "list all rules across every product" endpoint -- rules only ever
 * make sense in the context of one product's own material/size/printing-side values, so the
 * admin workspace fetches this per product (see admin/pricing-rules/page.tsx).
 */
export async function getPricingRulesByProduct(productId: string, token: string): Promise<PricingRule[]> {
  const res = await apiFetch<CatalogApiResponse<PricingRule[]>>(
    `/api/pricing-rules/product/${productId}`,
    { headers: getAuthHeaders(token) },
  );
  return res.data;
}

/** POST /api/pricing-rules — create a pricing rule for a product. Requires Manager token. */
export async function createPricingRule(input: CreatePricingRuleInput, token: string): Promise<PricingRule> {
  const res = await apiFetch<CatalogApiResponse<PricingRule>>("/api/pricing-rules", {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** PUT /api/pricing-rules/{id} — update a pricing rule (ProductId is immutable). Requires Manager token. */
export async function updatePricingRule(
  id: string,
  input: UpdatePricingRuleInput,
  token: string,
): Promise<PricingRule> {
  const res = await apiFetch<CatalogApiResponse<PricingRule>>(`/api/pricing-rules/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * DELETE /api/pricing-rules/{id} — permanently deletes the rule (the backend performs a real
 * hard delete; there is no soft-delete path here, unlike OptionDefinition). Requires Manager
 * token. Historical quote snapshots are unaffected: QuoteRequest.AppliedPricingRuleIdSnapshot is
 * traceability-only, never a real FK, and is never re-resolved.
 */
export async function deletePricingRule(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(`/api/pricing-rules/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
