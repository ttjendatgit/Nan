import type {
  MediaFolder,
  MediaUploadResponse,
  MediaUploadResult,
  MultipleMediaUploadResponse,
} from "@/types/media";
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
