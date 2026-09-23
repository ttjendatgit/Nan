export interface MediaUploadResult {
  publicId: string;
  secureUrl: string;
  originalFilename: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  folder: string;
  createdAt: string;
}

export interface MediaUploadResponse {
  data: MediaUploadResult;
  message: string;
  success: boolean;
}

export interface MultipleMediaUploadResponse {
  data: MediaUploadResult[];
  message: string;
  success: boolean;
}

/** Folder slugs accepted by the backend Media upload endpoints. */
export type MediaFolder =
  | "homepage"
  | "products"
  | "categories"
  | "materials"
  | "design-uploads"
  | "temp"
  | "collections"
  | "hero"
  | "content";

// ─── Media Library (Phase 2.0) ─────────────────────────────────────────────
// Mirrors the backend MediaAssetDto exactly. Deliberately a separate shape from
// MediaUploadResult above (different field names: url vs secureUrl, size vs bytes, ...) --
// that type is tied to the legacy upload response contract (ContentBlockEditor,
// useCatalogImageUpload) and is left untouched.

export interface MediaAsset {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  folder?: string | null;
  createdAt: string;
  updatedAt: string;
}
