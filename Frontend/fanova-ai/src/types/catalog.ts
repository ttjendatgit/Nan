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
