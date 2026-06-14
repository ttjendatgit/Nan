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
  | "hero";
