import type {
  CatalogApiResponse,
  CreateOptionDefinitionInput,
  OptionDefinition,
  UpdateOptionDefinitionInput,
} from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

/** GET /api/option-definitions — full catalog, including inactive entries and usage counts. Requires Manager token. */
export async function getOptionDefinitions(
  token: string,
  activeOnly = false,
): Promise<OptionDefinition[]> {
  const res = await apiFetch<CatalogApiResponse<OptionDefinition[]>>(
    `/api/option-definitions?activeOnly=${activeOnly}`,
    { headers: getAuthHeaders(token) },
  );
  return res.data;
}

/** POST /api/option-definitions — create a new catalog entry. Requires Manager token. */
export async function createOptionDefinition(
  input: CreateOptionDefinitionInput,
  token: string,
): Promise<OptionDefinition> {
  const res = await apiFetch<CatalogApiResponse<OptionDefinition>>("/api/option-definitions", {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** PUT /api/option-definitions/{id} — update a catalog entry (price, label, active state). Requires Manager token. */
export async function updateOptionDefinition(
  id: string,
  input: UpdateOptionDefinitionInput,
  token: string,
): Promise<OptionDefinition> {
  const res = await apiFetch<CatalogApiResponse<OptionDefinition>>(`/api/option-definitions/${id}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * DELETE /api/option-definitions/{id} — permanently delete a catalog entry. Requires Manager token.
 * Rejected by the backend (422) if referenced by any quote history or currently assigned to any
 * product — deactivate instead in that case.
 */
export async function deleteOptionDefinition(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(`/api/option-definitions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
