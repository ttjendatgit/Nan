import type {
  CreateQuoteRequestInput,
  QuoteRequestApiResponse,
  QuoteRequestDto,
  QuoteRequestListApiResponse,
  QuoteRequestListData,
  QuoteRequestQueryParams,
  QuoteRequestStatus,
  QuoteStatusUpdateApiResponse,
  QuoteStatusUpdateResult,
  SetFinalQuotedPriceInput,
} from "@/types/quote";
import { apiFetch, getAuthHeaders } from "./client";

/** POST /api/QuoteRequests — public, no auth required. */
export async function createQuoteRequest(
  input: CreateQuoteRequestInput,
): Promise<QuoteRequestApiResponse> {
  return apiFetch<QuoteRequestApiResponse>("/api/QuoteRequests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ─── Admin-only helpers (require Staff or Manager token) ──────────────────────

function buildQuoteListUrl(params: QuoteRequestQueryParams): string {
  const qs = new URLSearchParams();
  if (params.pageNumber !== undefined) qs.set("pageNumber", String(params.pageNumber));
  if (params.pageSize !== undefined)   qs.set("pageSize",   String(params.pageSize));
  if (params.status)                   qs.set("status",     params.status);
  if (params.search?.trim())           qs.set("search",     params.search.trim());
  const str = qs.toString();
  return str ? `/api/QuoteRequests?${str}` : "/api/QuoteRequests";
}

/** GET /api/QuoteRequests — paginated list. Requires Staff or Manager token. */
export async function getQuoteRequests(
  params: QuoteRequestQueryParams,
  token: string,
): Promise<QuoteRequestListData> {
  const res = await apiFetch<QuoteRequestListApiResponse>(buildQuoteListUrl(params), {
    headers: getAuthHeaders(token),
  });
  return res.data;
}

/** GET /api/QuoteRequests/{id} — single quote detail. Requires Staff or Manager token. */
export async function getQuoteRequestById(
  id: string,
  token: string,
): Promise<QuoteRequestDto> {
  const res = await apiFetch<QuoteRequestApiResponse>(`/api/QuoteRequests/${id}`, {
    headers: getAuthHeaders(token),
  });
  return res.data;
}

/**
 * PUT /api/QuoteRequests/{id}/status — update status. Requires Staff or Manager token.
 *
 * A real transition into "Contacted" or "Quoted" triggers a backend-sent customer email, resolved
 * server-side from the quote's own customer-provided contact email -- never from this call. That
 * address is unverified (Nan does not confirm email ownership at submission or elsewhere), so
 * this is best-effort delivery, not a confirmed or account-linked address. The response's
 * `notification.outcome` reports what happened (Sent / Failed / SkippedNoEmail / NotRequired) so
 * the caller never has to infer it from `status`.
 */
export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequestStatus,
  token: string,
): Promise<QuoteStatusUpdateResult> {
  const res = await apiFetch<QuoteStatusUpdateApiResponse>(
    `/api/QuoteRequests/${id}/status`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

/** PUT /api/QuoteRequests/{id}/final-price — set a manual price override. Requires Staff or Manager token. */
export async function setFinalQuotedPrice(
  id: string,
  input: SetFinalQuotedPriceInput,
  token: string,
): Promise<QuoteRequestDto> {
  const res = await apiFetch<QuoteRequestApiResponse>(
    `/api/QuoteRequests/${id}/final-price`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return res.data;
}
