import type {
  MediaAsset,
  MediaFolder,
  MediaUploadResponse,
  MediaUploadResult,
  MultipleMediaUploadResponse,
} from "@/types/media";
import type { CatalogApiResponse, PagedResult } from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

/**
 * Upload a single file to Cloudinary via the backend.
 * The backend reads credentials — the secret is never in the browser.
 */
export async function uploadMedia(
  file: File,
  folder?: MediaFolder,
  token?: string,
): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append("file", file);

  const params = folder ? `?folder=${encodeURIComponent(folder)}` : "";
  const res = await apiFetch<MediaUploadResponse>(
    `/api/Media/upload${params}`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: form,
    },
  );

  return res.data;
}

/**
 * Upload multiple files to Cloudinary via the backend (up to 10 per request).
 */
export async function uploadMultipleMedia(
  files: File[],
  folder?: MediaFolder,
  token?: string,
): Promise<MediaUploadResult[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const params = folder ? `?folder=${encodeURIComponent(folder)}` : "";
  const res = await apiFetch<MultipleMediaUploadResponse>(
    `/api/Media/upload-multiple${params}`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: form,
    },
  );

  return res.data;
}

/**
 * Delete a Cloudinary asset by its public ID.
 * The publicId may contain slashes (e.g. "nan/products/abc123").
 */
export async function deleteMedia(
  publicId: string,
  token?: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/Media/${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
}

// ─── Media Library (Phase 2.0) ─────────────────────────────────────────────

/** GET /api/Media — paginated, DB-indexed Media Library list. Requires Manager token. */
export async function getMediaAssets(
  params: { search?: string; pageNumber?: number; pageSize?: number },
  token: string,
): Promise<PagedResult<MediaAsset>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();

  const res = await apiFetch<CatalogApiResponse<PagedResult<MediaAsset>>>(
    `/api/Media${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders(token) },
  );
  return res.data;
}

/**
 * DELETE /api/Media/{id} — deletes a Media Library asset (both the DB index row and the
 * Cloudinary asset) by its MediaAsset id. Distinct from deleteMedia() above, which takes a raw
 * Cloudinary publicId for the older, pre-Media-Library delete path.
 */
export async function deleteMediaAsset(id: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/Media/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
