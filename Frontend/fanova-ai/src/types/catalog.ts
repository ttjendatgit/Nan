// ─── Content Blocks ──────────────────────────────────────────────────────────

export type BlockAlign = "left" | "center" | "right";
export type BlockTone = "default" | "muted" | "accent" | "gold";
export type ParagraphWeight = "regular" | "medium" | "semibold" | "bold";
export type ParagraphSize = "sm" | "base" | "lg";
export type ListStyle = "bullet" | "number";
export type ListTone = "default" | "accent";
export type QuoteTone = "default" | "accent" | "gold";

export interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  text: string;
  align?: BlockAlign;
  tone?: BlockTone;
  italic?: boolean;
}

export interface ParagraphBlock {
  type: "paragraph";
  text: string;
  align?: BlockAlign;
  tone?: BlockTone;
  weight?: ParagraphWeight;
  italic?: boolean;
  size?: ParagraphSize;
}

export interface ImageBlock {
  type: "image";
  secureUrl: string;
  publicId: string;
  alt: string;
  caption?: string;
}

export interface ListBlock {
  type: "list";
  items: string[];
  style?: ListStyle;
  tone?: ListTone;
}

export interface QuoteBlock {
  type: "quote";
  text: string;
  caption?: string;
  tone?: QuoteTone;
}

export interface DividerBlock {
  type: "divider";
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | QuoteBlock
  | DividerBlock;

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  minQuantity: number;
  /** Cloudinary secureUrl for the product's main image. Set automatically by POST /api/Products/with-image. */
  imageUrl?: string;
  isCustomizable: boolean;
  estimatedProductionDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Raw JSON string from backend ContentBlocksJson column. May be missing/null/empty until content is authored. */
  contentBlocksJson?: string | null;
  /** Parsed content blocks, hydrated by the API helper. Not sent by the backend directly. */
  contentBlocks?: ContentBlock[];
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  minQuantity?: number;
  /** Cloudinary secureUrl. Set automatically by POST /api/Products/with-image. */
  imageUrl?: string;
  isCustomizable?: boolean;
  estimatedProductionDays?: number;
  isActive?: boolean;
}

export type UpdateProductInput = CreateProductInput;

// ─── Category ────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Cloudinary secureUrl for the category banner/thumbnail. Set automatically by POST /api/Categories/with-image. */
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  /** Cloudinary secureUrl. Set automatically by POST /api/Categories/with-image. */
  imageUrl?: string;
  isActive?: boolean;
}

export type UpdateCategoryInput = CreateCategoryInput;

// ─── Shared API shapes ────────────────────────────────────────────────────────

export interface CatalogApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Matches the backend PagedResult<T> shape. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

// ─── Product Option ───────────────────────────────────────────────────────────

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  type?: string;
  values: string[];
  isRequired?: boolean;
  sortOrder?: number;
}
