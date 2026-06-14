import type {
  CatalogApiResponse,
  CreateCategoryInput,
  PagedResult,
  PaginationParams,
  ProductCategory,
  UpdateCategoryInput,
} from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

function categoriesUrl(path = "", params?: Record<string, string | number | boolean | undefined>) {
  const base = `/api/Categories${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

/** GET /api/Categories — paginated list (public). */
export async function getCategories(
  params?: PaginationParams & { activeOnly?: boolean },
): Promise<PagedResult<ProductCategory>> {
  const res = await apiFetch<CatalogApiResponse<PagedResult<ProductCategory>>>(
    categoriesUrl("", params as Record<string, string | number | boolean | undefined>),
  );
  return res.data;
}

/** GET /api/Categories/{id} — single category (public). */
export async function getCategory(id: string): Promise<ProductCategory> {
  const res = await apiFetch<CatalogApiResponse<ProductCategory>>(categoriesUrl(`/${id}`));
  return res.data;
}

/**
 * POST /api/Categories — create category. Requires Manager token.
 *
 * Image workflow:
 *   1. Upload via uploadMedia(file, "products", token) → get secureUrl
 *   2. Pass secureUrl as input.imageUrl here.
 *
 * TODO (security): endpoint should be restricted to Staff/Manager once role auth is tightened.
 */
export async function createCategory(
  input: CreateCategoryInput,
  token: string,
): Promise<ProductCategory> {
  const res = await apiFetch<CatalogApiResponse<ProductCategory>>(categoriesUrl(), {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * PUT /api/Categories/{id} — update category. Requires Manager token.
 *
 * To replace the image: upload the new file first, then set input.imageUrl to the new secureUrl.
 * Note: the old Cloudinary asset is NOT automatically deleted — call deleteMedia(oldPublicId) if needed.
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  token: string,
): Promise<ProductCategory> {
  const res = await apiFetch<CatalogApiResponse<ProductCategory>>(categoriesUrl(`/${id}`), {
    method: "PUT",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.data;
}

/** DELETE /api/Categories/{id} — delete category. Requires Manager token. Fails if category has products. */
export async function deleteCategory(id: string, token: string): Promise<void> {
  await apiFetch<CatalogApiResponse<null>>(categoriesUrl(`/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

/**
 * POST /api/Categories/with-image — create category with direct image upload. Requires Manager token.
 * Send FormData with fields: name, slug?, description?, isActive, image? (File).
 * Backend uploads image to Cloudinary and stores the secureUrl as imageUrl.
 */
export async function createCategoryWithImage(
  fd: FormData,
  token: string,
): Promise<ProductCategory> {
  const res = await apiFetch<CatalogApiResponse<ProductCategory>>(
    categoriesUrl("/with-image"),
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: fd,
    },
  );
  return res.data;
}

/**
 * PUT /api/Categories/{id}/with-image — update category, optionally replacing image. Requires Manager token.
 * Send FormData with fields: name, slug?, description?, isActive, image? (File).
 * If image is omitted, the existing imageUrl is preserved on the backend.
 */
export async function updateCategoryWithImage(
  id: string,
  fd: FormData,
  token: string,
): Promise<ProductCategory> {
  const res = await apiFetch<CatalogApiResponse<ProductCategory>>(
    categoriesUrl(`/${id}/with-image`),
    {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: fd,
    },
  );
  return res.data;
}
