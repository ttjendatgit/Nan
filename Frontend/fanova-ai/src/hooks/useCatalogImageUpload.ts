"use client";

import { useState } from "react";
import { uploadMedia } from "@/lib/api/media";
import type { MediaUploadResult } from "@/types/media";

type CatalogImageFolder = "products" | "categories" | "materials" | "collections";

interface CatalogImageUploadState {
  uploading: boolean;
  result?: MediaUploadResult;
  error?: string;
}

/**
 * Reusable hook for uploading a single image for use in product/category/homepage image fields.
 *
 * Usage in an admin form:
 * ```tsx
 * const { uploading, result, upload, reset } = useCatalogImageUpload(token);
 *
 * async function handleFileChange(file: File) {
 *   const uploaded = await upload(file, "products");
 *   // Pass uploaded.secureUrl into your product/category form state as imageUrl
 *   setForm(f => ({ ...f, imageUrl: uploaded.secureUrl }));
 * }
 * ```
 *
 * TODO (admin CMS): when the admin saves a product/category with a new imageUrl, also store
 * `result.publicId` somewhere (e.g. a separate form field) so the old Cloudinary asset can
 * be deleted via deleteMedia(oldPublicId) when the image is replaced.
 */
export function useCatalogImageUpload(token?: string) {
  const [state, setState] = useState<CatalogImageUploadState>({ uploading: false });

  async function upload(
    file: File,
    folder: CatalogImageFolder = "products",
  ): Promise<MediaUploadResult> {
    setState({ uploading: true, result: undefined, error: undefined });
    try {
      const result = await uploadMedia(file, folder, token);
      setState({ uploading: false, result });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : "Upload failed.";
      setState({ uploading: false, error });
      throw err;
    }
  }

  function reset() {
    setState({ uploading: false });
  }

  return {
    uploading: state.uploading,
    /** The secureUrl to store in product.imageUrl or category.imageUrl */
    secureUrl: state.result?.secureUrl,
    /** The publicId to use with DELETE /api/Media/{publicId} when replacing the image */
    publicId: state.result?.publicId,
    result: state.result,
    error: state.error,
    upload,
    reset,
  };
}
