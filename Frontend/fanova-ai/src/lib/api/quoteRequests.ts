import type {
  CreateQuoteRequestInput,
  QuoteRequestApiResponse,
  QuoteRequestDto,
  QuoteRequestListApiResponse,
  QuoteRequestListData,
  QuoteRequestQueryParams,
  QuoteRequestStatus,
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

/** PUT /api/QuoteRequests/{id}/status — update status. Requires Staff or Manager token. */
export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequestStatus,
  token: string,
): Promise<QuoteRequestDto> {
  const res = await apiFetch<QuoteRequestApiResponse>(
    `/api/QuoteRequests/${id}/status`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}
