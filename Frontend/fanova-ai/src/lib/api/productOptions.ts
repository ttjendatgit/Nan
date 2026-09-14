import type {
  AssignOptionInput,
  CatalogApiResponse,
  ProductOption,
  ProductOptionsGrouped,
  UpdateAssignmentInput,
} from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

/**
 * GET /api/Products/{productId}/options — per-product assigned options, grouped by optionType.
 * Pricing/label fields are read live from each assignment's catalog entry.
 *
 * Public (no token): only active assignments, matching what the customer configurator sees.
 * With a Manager token: every assignment, active or not -- the backend's own
 * `!User.IsInRole(Manager)` check decides this server-side, this client just needs to send the
 * Authorization header for that check to see the caller as a Manager.
 *
 * The backend returns a grouped object ({ productId, groups: [...] }), never a bare array.
 */
export async function getProductOptionGroups(productId: string, token?: string): Promise<ProductOptionsGrouped> {
  const res = await apiFetch<CatalogApiResponse<ProductOptionsGrouped>>(
    `/api/Products/${productId}/options`,
    token ? { headers: getAuthHeaders(token) } : undefined,
  );
  return res.data ?? { productId, groups: [] };
}

/** Flattens a grouped response into a single list, ordered the same way the backend orders groups/options. */
export function flattenOptionGroups(grouped: ProductOptionsGrouped): ProductOption[] {
  return grouped.groups.flatMap((g) => g.options);
}

/**
 * POST /api/Products/{productId}/options — assign an existing catalog entry to this product.
 * Does NOT create a new catalog entry (use lib/api/optionDefinitions.ts for that). Requires Manager token.
 */
export async function assignOptionToProduct(
  productId: string,
  input: AssignOptionInput,
  token: string,
): Promise<ProductOption> {
  const res = await apiFetch<CatalogApiResponse<ProductOption>>(
    `/api/Products/${productId}/options`,
    {
      method: "POST",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

/**
 * PUT /api/product-options/{id} — update a product's assignment (display order / per-product
 * active flag). Never changes the catalog entry's price or label. Requires Manager token.
 */
export async function updateAssignment(
  id: string,
  input: UpdateAssignmentInput,
  token: string,
): Promise<ProductOption> {
  const res = await apiFetch<CatalogApiResponse<ProductOption>>(
    `/api/product-options/${id}`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

/**
 * DELETE /api/product-options/{id} — remove this assignment from the product ("Bỏ khỏi sản phẩm").
 * This is a routine, non-destructive action: it never touches the global catalog entry, which
 * remains available to assign to other products (or back to this one). Requires Manager token.
 */
export async function removeAssignment(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(`/api/product-options/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
