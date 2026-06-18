import type { CreateQuoteRequestInput, QuoteRequestApiResponse } from "@/types/quote";
import { apiFetch } from "./client";

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
