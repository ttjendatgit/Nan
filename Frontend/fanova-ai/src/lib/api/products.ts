import type {
  CatalogApiResponse,
  CreateProductInput,
  PagedResult,
  PaginationParams,
  Product,
  ProductOption,
  UpdateProductInput,
} from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

function productsUrl(path = "", params?: Record<string, string | number | boolean | undefined>) {
  const base = `/api/Products${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

/** GET /api/Products — paginated list (public). */
export async function getProducts(
  params?: PaginationParams & { search?: string; categoryId?: string; activeOnly?: boolean },
): Promise<PagedResult<Product>> {
  const res = await apiFetch<CatalogApiResponse<PagedResult<Product>>>(
    productsUrl("", params as Record<string, string | number | boolean | undefined>),
  );
  return res.data;
}

/** GET /api/Products/{id} — single product (public). */
export async function getProduct(id: string): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(productsUrl(`/${id}`));
  return res.data;
}

/** GET /api/Products/by-category/{categoryId} — products in a category (public). */
export async function getProductsByCategory(
  categoryId: string,
  params?: PaginationParams,
): Promise<PagedResult<Product>> {
  const res = await apiFetch<CatalogApiResponse<PagedResult<Product>>>(
    productsUrl(`/by-category/${categoryId}`, params as Record<string, string | number | boolean | undefined>),
  );
  return res.data;
}

/** GET /api/Products/{productId}/options — customization options for a product (public). */
export async function getProductOptions(productId: string): Promise<ProductOption[]> {
  const res = await apiFetch<CatalogApiResponse<ProductOption[]>>(
    productsUrl(`/${productId}/options`),
  );
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * POST /api/Products — create product. Requires Manager token.
 *
 * Image workflow:
 *   1. Upload via uploadMedia(file, "products", token) → get secureUrl
 *   2. Pass secureUrl as input.imageUrl here.
 *
 * TODO (security): endpoint should be restricted to Staff/Manager once role auth is tightened.
 */
export async function createProduct(
  input: CreateProductInput,
  token: string,
): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(productsUrl(), {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * PUT /api/Products/{id} — update product. Requires Manager token.
 *
 * To replace the image: upload the new file first, then set input.imageUrl to the new secureUrl.
 * Note: the old Cloudinary asset is NOT automatically deleted — call deleteMedia(oldPublicId) if needed.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  token: string,
): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(productsUrl(`/${id}`), {
    method: "PUT",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** DELETE /api/Products/{id} — delete product. Requires Manager token. */
export async function deleteProduct(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(productsUrl(`/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

/**
 * POST /api/Products/with-image — create product with direct image upload. Requires Manager token.
 * Send FormData with fields: categoryId, name, slug?, description?, basePrice, minQuantity?,
 * estimatedProductionDays?, isCustomizable?, isActive?, image? (File).
 * Backend uploads image to Cloudinary and stores the secureUrl as imageUrl.
 */
export async function createProductWithImage(
  fd: FormData,
  token: string,
): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(
    productsUrl("/with-image"),
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: fd,
    },
  );
  return res.data;
}

/**
 * PUT /api/Products/{id}/with-image — update product, optionally replacing image. Requires Manager token.
 * Send FormData with fields: categoryId, name, slug?, description?, basePrice, minQuantity?,
 * estimatedProductionDays?, isCustomizable?, isActive?, image? (File).
 * If image is omitted, the existing imageUrl is preserved on the backend.
 */
export async function updateProductWithImage(
  id: string,
  fd: FormData,
  token: string,
): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(
    productsUrl(`/${id}/with-image`),
    {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: fd,
    },
  );
  return res.data;
}
