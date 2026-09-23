// Mirrors the backend ContentDocument DTOs (Backend/.../DTOs/Content/*.cs). Phase 1.1/1.2
// foundation: one row can eventually back product content, a static page, or a blog post.
// Type and ProductId are immutable after creation -- there is no update field for either.

export type ContentDocumentType = "ProductContent" | "Page" | "BlogPost";
export type ContentStatus = "Draft" | "Published" | "Archived";

export interface ContentDocument {
  id: string;
  type: string;
  productId?: string | null;
  slug: string;
  title: string;
  status: string;
  blocksJson?: string | null;
  draftBlocksJson?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoImageUrl?: string | null;
  canonicalUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentDocumentInput {
  type: string;
  productId?: string | null;
  title: string;
  slug?: string | null;
  status: string;
  blocksJson?: string | null;
  draftBlocksJson?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoImageUrl?: string | null;
  canonicalUrl?: string | null;
}

/** ProductId and Type are not included -- the backend's UpdateContentDocumentRequest has no
 * fields for either, since they're immutable after creation. */
export interface UpdateContentDocumentInput {
  title: string;
  slug?: string | null;
  status: string;
  blocksJson?: string | null;
  draftBlocksJson?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoImageUrl?: string | null;
  canonicalUrl?: string | null;
}
