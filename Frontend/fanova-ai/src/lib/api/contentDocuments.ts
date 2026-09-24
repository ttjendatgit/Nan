import type { CatalogApiResponse, PagedResult } from "@/types/catalog";
import type { ContentDocument, CreateContentDocumentInput, UpdateContentDocumentInput } from "@/types/content";
import { apiFetch, getAuthHeaders } from "./client";

function contentDocumentsUrl(path = "", params?: Record<string, string | number | undefined>) {
  const base = `/api/content-documents${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

/** GET /api/content-documents — paginated list, optional Type filter. Requires Manager token
 * (the endpoint is Manager-only throughout; the anonymous Published-only read path is
 * /api/content-documents/published/{type}[/{slug}]). */
export async function getContentDocuments(
  params: { type?: string; pageNumber?: number; pageSize?: number },
  token: string,
): Promise<PagedResult<ContentDocument>> {
  const res = await apiFetch<CatalogApiResponse<PagedResult<ContentDocument>>>(
    contentDocumentsUrl("", params),
    { headers: getAuthHeaders(token) },
  );
  return res.data;
}

/** GET /api/content-documents/{id} — single document. Requires Manager token. */
export async function getContentDocument(id: string, token: string): Promise<ContentDocument> {
  const res = await apiFetch<CatalogApiResponse<ContentDocument>>(
    contentDocumentsUrl(`/${id}`),
    { headers: getAuthHeaders(token) },
  );
  return res.data;
}

/** POST /api/content-documents — create a document. Requires Manager token. */
export async function createContentDocument(
  input: CreateContentDocumentInput,
  token: string,
): Promise<ContentDocument> {
  const res = await apiFetch<CatalogApiResponse<ContentDocument>>(contentDocumentsUrl(), {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** PUT /api/content-documents/{id} — update a document (Type/ProductId are immutable, not sent). Requires Manager token. */
export async function updateContentDocument(
  id: string,
  input: UpdateContentDocumentInput,
  token: string,
): Promise<ContentDocument> {
  const res = await apiFetch<CatalogApiResponse<ContentDocument>>(contentDocumentsUrl(`/${id}`), {
    method: "PUT",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** DELETE /api/content-documents/{id} — permanent delete. Requires Manager token. */
export async function deleteContentDocument(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(contentDocumentsUrl(`/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
