/**
 * Single source of truth for ContentDocument's Type/Status enum -> Vietnamese display label,
 * shared by the content library list and the Content Studio workspace shell. Mirrors the
 * optionTypeLabel() pattern in lib/optionTypes.ts -- the raw enum value is never shown to an
 * admin, only these labels are.
 */

export const CONTENT_TYPE_VALUES = ["ProductContent", "Page", "BlogPost"] as const;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ProductContent: "Nội dung sản phẩm",
  Page: "Trang tĩnh",
  BlogPost: "Bài viết blog",
};

export function contentTypeLabel(type: string): string {
  return CONTENT_TYPE_LABELS[type] ?? type;
}

export const CONTENT_STATUS_VALUES = ["Draft", "Published", "Archived"] as const;

const CONTENT_STATUS_LABELS: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã xuất bản",
  Archived: "Đã lưu trữ",
};

/** Reuses the existing admin-badge-* color language (globals.css) -- no new badge colors introduced. */
export const CONTENT_STATUS_BADGE_CLS: Record<string, string> = {
  Draft: "admin-badge-inactive",
  Published: "admin-badge-active",
  Archived: "admin-badge-hidden",
};

export function contentStatusLabel(status: string): string {
  return CONTENT_STATUS_LABELS[status] ?? status;
}
