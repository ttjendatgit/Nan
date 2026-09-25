import { cache } from "react";
import type { CatalogApiResponse } from "@/types/catalog";
import type { PublishedContentDocument } from "@/types/content";
import { API_BASE_URL } from "./client";

/**
 * Server-side, anonymous read of one Published Page (Content Studio B2) -- used by
 * app/[slug]/page.tsx for both the page and its generateMetadata. No token, no browser APIs.
 *
 * - 404 from the API (missing slug, Draft/Archived, or a document of another Type) -> `null`, so
 *   the caller can notFound(). Drafts are never fetched as a fallback.
 * - Any other failure (network error, 5xx, malformed body) throws -- it is not treated as "not
 *   found", so an API outage surfaces as an error instead of silently 404ing real pages.
 *
 * `cache: "no-store"`: always the current published content (no revalidation/tags yet, B2).
 * Wrapped in React `cache` so the page and generateMetadata share a single request per render.
 */
export const getPublishedPage = cache(async (slug: string): Promise<PublishedContentDocument | null> => {
  const res = await fetch(
    `${API_BASE_URL}/api/content-documents/published/page/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Published page request failed: ${res.status} ${res.statusText}`);

  const body = (await res.json()) as CatalogApiResponse<PublishedContentDocument>;
  const data = body?.data;
  if (!body?.success || !data || typeof data.slug !== "string" || typeof data.title !== "string") {
    throw new Error("Published page response has an unexpected shape.");
  }
  return data;
});
