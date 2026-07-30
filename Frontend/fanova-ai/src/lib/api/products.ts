import type {
  CatalogApiResponse,
  ContentBlock,
  CreateProductInput,
  PagedResult,
  PaginationParams,
  Product,
  ProductOption,
  UpdateProductInput,
} from "@/types/catalog";
import { apiFetch, getAuthHeaders } from "./client";

// ─── Content blocks parser ───────────────────────────────────────────────────

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asAlign(value: unknown): "left" | "center" | "right" | undefined {
  return value === "left" || value === "center" || value === "right"
    ? value
    : undefined;
}

function asBlockTone(
  value: unknown
): "default" | "muted" | "accent" | "gold" | undefined {
  return value === "default" ||
    value === "muted" ||
    value === "accent" ||
    value === "gold"
    ? value
    : undefined;
}

function asParagraphWeight(
  value: unknown
): "regular" | "medium" | "semibold" | "bold" | undefined {
  return value === "regular" ||
    value === "medium" ||
    value === "semibold" ||
    value === "bold"
    ? value
    : undefined;
}

function asParagraphSize(value: unknown): "sm" | "base" | "lg" | undefined {
  return value === "sm" || value === "base" || value === "lg"
    ? value
    : undefined;
}

function asListStyle(value: unknown): "bullet" | "number" | undefined {
  return value === "bullet" || value === "number" ? value : undefined;
}

function asListTone(value: unknown): "default" | "accent" | undefined {
  return value === "default" || value === "accent" ? value : undefined;
}

function asQuoteTone(
  value: unknown
): "default" | "accent" | "gold" | undefined {
  return value === "default" || value === "accent" || value === "gold"
    ? value
    : undefined;
}

/**
 * Safely parse contentBlocksJson into a ContentBlock[].
 * Returns [] if the value is missing, null, empty, or invalid JSON.
 * Each block is validated per-type; malformed entries are silently dropped.
 */
function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw || typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];

    const result: ContentBlock[] = [];

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const blockType = entry.type;

      if (blockType === "heading") {
        if (!isNonEmptyString(entry.text)) continue;
        const level = entry.level === 3 ? 3 : 2; // default to 2 if missing or invalid
        result.push({
          type: "heading",
          level,
          text: entry.text,
          ...(asAlign(entry.align) ? { align: asAlign(entry.align) } : {}),
          ...(asBlockTone(entry.tone) ? { tone: asBlockTone(entry.tone) } : {}),
          ...(entry.italic === true ? { italic: true } : {}),
        });
      } else if (blockType === "paragraph") {
        if (!isNonEmptyString(entry.text)) continue;
        result.push({
          type: "paragraph",
          text: entry.text,
          ...(asAlign(entry.align) ? { align: asAlign(entry.align) } : {}),
          ...(asBlockTone(entry.tone) ? { tone: asBlockTone(entry.tone) } : {}),
          ...(asParagraphWeight(entry.weight)
            ? { weight: asParagraphWeight(entry.weight) }
            : {}),
          ...(asParagraphSize(entry.size)
            ? { size: asParagraphSize(entry.size) }
            : {}),
          ...(entry.italic === true ? { italic: true } : {}),
        });
      } else if (blockType === "image") {
        if (!isNonEmptyString(entry.secureUrl)) continue;
        const alt = isNonEmptyString(entry.alt)
          ? entry.alt
          : isNonEmptyString(entry.caption)
            ? entry.caption
            : "Product content image";
        result.push({
          type: "image",
          secureUrl: entry.secureUrl,
          publicId: isNonEmptyString(entry.publicId) ? entry.publicId : "",
          alt,
          ...(isNonEmptyString(entry.caption) ? { caption: entry.caption } : {}),
        });
      } else if (blockType === "list") {
        if (!Array.isArray(entry.items)) continue;
        const items = entry.items
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
        if (items.length === 0) continue;
        result.push({
          type: "list",
          items,
          ...(asListStyle(entry.style) ? { style: asListStyle(entry.style) } : {}),
          ...(asListTone(entry.tone) ? { tone: asListTone(entry.tone) } : {}),
        });
      } else if (blockType === "quote") {
        if (!isNonEmptyString(entry.text)) continue;
        result.push({
          type: "quote",
          text: entry.text,
          ...(isNonEmptyString(entry.caption) ? { caption: entry.caption } : {}),
          ...(asQuoteTone(entry.tone) ? { tone: asQuoteTone(entry.tone) } : {}),
        });
      } else if (blockType === "divider") {
        result.push({ type: "divider" });
      }
      // Unknown block types are silently skipped
    }

    return result;
  } catch {
    return [];
  }
}

/** Hydrate a single product with parsed contentBlocks. */
function hydrateContentBlocks<T extends Product>(product: T): T {
  return {
    ...product,
    contentBlocks: parseContentBlocks(product.contentBlocksJson),
  };
}

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
  return {
    ...res.data,
    items: res.data.items.map(hydrateContentBlocks),
  };
}

/** GET /api/Products/{id} — single product (public). */
export async function getProduct(id: string): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(productsUrl(`/${id}`));
  return hydrateContentBlocks(res.data);
}

/** GET /api/Products/by-category/{categoryId} — products in a category (public). */
export async function getProductsByCategory(
  categoryId: string,
  params?: PaginationParams,
): Promise<PagedResult<Product>> {
  const res = await apiFetch<CatalogApiResponse<PagedResult<Product>>>(
    productsUrl(`/by-category/${categoryId}`, params as Record<string, string | number | boolean | undefined>),
  );
  return {
    ...res.data,
    items: res.data.items.map(hydrateContentBlocks),
  };
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

/**
 * PUT /api/Products/{id}/content -- save content blocks. Requires Manager token.
 * Sends { contentBlocksJson: JSON.stringify(blocks) } and returns a hydrated Product.
 */
export async function updateProductContent(
  id: string,
  blocks: ContentBlock[],
  token: string,
): Promise<Product> {
  const res = await apiFetch<CatalogApiResponse<Product>>(
    productsUrl(`/${id}/content`),
    {
      method: "PUT",
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ contentBlocksJson: JSON.stringify(blocks) }),
    },
  );
  return hydrateContentBlocks(res.data);
}
