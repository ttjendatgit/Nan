"use client";

import { useId } from "react";

const LABEL_CLS = "block text-xs font-medium mb-1.5";
const ERROR_CLS = "mt-1.5 text-[11px] leading-snug";
const HINT_CLS = "mt-1.5 text-[11px] leading-snug";

const SEO_TITLE_MAX = 200;
const SEO_DESCRIPTION_MAX = 500;
const SEO_KEYWORDS_MAX = 500;
const SEO_IMAGE_URL_MAX = 500;
const CANONICAL_URL_MAX = 500;

/** Local to this form, matching the same Field pattern already used in ContentMetadataForm,
 * pricing-rules, and the (former) options forms -- no shared Field component exists to import. */
function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className={ERROR_CLS} style={{ color: "var(--admin-danger)" }}>{error}</p>
      ) : hint ? (
        <p className={HINT_CLS} style={{ color: "var(--admin-text-subtle)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const count = value.length;
  const ratio = max > 0 ? count / max : 0;
  const color = count > max
    ? "var(--admin-danger)"
    : ratio >= 0.9
      ? "var(--admin-warning)"
      : "var(--admin-text-subtle)";

  return (
    <p className="mt-1 text-right font-mono text-[10px]" style={{ color }} aria-live="off">
      {count} / {max}
    </p>
  );
}

export interface SeoErrors {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoImageUrl?: string;
  canonicalUrl?: string;
}

interface SeoPanelProps {
  seoTitle: string;
  onSeoTitleChange: (value: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (value: string) => void;
  seoKeywords: string;
  onSeoKeywordsChange: (value: string) => void;
  seoImageUrl: string;
  onSeoImageUrlChange: (value: string) => void;
  canonicalUrl: string;
  onCanonicalUrlChange: (value: string) => void;
  /** Document Title, shown in the Google preview when SeoTitle is empty (the same "override
   * only when set" behavior the backend gives SeoTitle). */
  fallbackTitle: string;
  /** Shown as the preview breadcrumb -- purely illustrative, not a real published URL. */
  slug: string;
  errors: SeoErrors;
}

/**
 * SEO metadata for the document: Title/Description/Keywords/Image/Canonical, plus a live Google
 * search-result mockup so the effect of what's typed is visible immediately. Foundation only --
 * no sitemap, robots.txt, OpenGraph rendering, JSON-LD, or crawler exists yet; these fields are
 * just stored on the document for a later phase to consume.
 *
 * State lives in ContentStudio, not here (mirrors how ContentMetadataForm and TitleInput work) --
 * this component is presentation only, every value and every change handler comes in as a prop.
 */
export default function SeoPanel({
  seoTitle, onSeoTitleChange, seoDescription, onSeoDescriptionChange,
  seoKeywords, onSeoKeywordsChange, seoImageUrl, onSeoImageUrlChange,
  canonicalUrl, onCanonicalUrlChange, fallbackTitle, slug, errors,
}: SeoPanelProps) {
  const previewTitle = seoTitle.trim() || fallbackTitle.trim() || "Tiêu đề trang";
  const previewDescription = seoDescription.trim() || "Mô tả sẽ hiển thị ở đây khi bạn nhập Meta Description.";

  return (
    <div className="mb-5 rounded-xl p-4" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
      <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        SEO
      </p>

      <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 lg:grid-cols-2">
        {/* Fields */}
        <div className="flex flex-col gap-3.5">
          <Field label="SEO Title" error={errors.seoTitle} hint="Để trống để dùng Tiêu đề nội dung.">
            {(id) => (
              <>
                <input
                  id={id}
                  type="text"
                  value={seoTitle}
                  onChange={(e) => onSeoTitleChange(e.target.value.slice(0, SEO_TITLE_MAX))}
                  placeholder={fallbackTitle || "Nhập SEO Title..."}
                  maxLength={SEO_TITLE_MAX}
                  className="admin-input"
                />
                <CharCounter value={seoTitle} max={SEO_TITLE_MAX} />
              </>
            )}
          </Field>

          <Field label="Meta Description" error={errors.seoDescription}>
            {(id) => (
              <>
                <textarea
                  id={id}
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => onSeoDescriptionChange(e.target.value.slice(0, SEO_DESCRIPTION_MAX))}
                  placeholder="Mô tả ngắn gọn hiển thị trong kết quả tìm kiếm..."
                  maxLength={SEO_DESCRIPTION_MAX}
                  className="admin-input resize-y"
                />
                <CharCounter value={seoDescription} max={SEO_DESCRIPTION_MAX} />
              </>
            )}
          </Field>

          <Field label="Keywords" error={errors.seoKeywords} hint="Phân cách bằng dấu phẩy.">
            {(id) => (
              <input
                id={id}
                type="text"
                value={seoKeywords}
                onChange={(e) => onSeoKeywordsChange(e.target.value)}
                placeholder="quạt nan tre, quạt thủ công, quà tặng"
                maxLength={SEO_KEYWORDS_MAX}
                className="admin-input"
              />
            )}
          </Field>

          <Field label="SEO Image URL" error={errors.seoImageUrl} hint="Ảnh hiển thị khi chia sẻ liên kết.">
            {(id) => (
              <input
                id={id}
                type="text"
                value={seoImageUrl}
                onChange={(e) => onSeoImageUrlChange(e.target.value)}
                placeholder="https://..."
                maxLength={SEO_IMAGE_URL_MAX}
                className="admin-input font-mono text-xs"
              />
            )}
          </Field>

          <Field label="Canonical URL" error={errors.canonicalUrl} hint="Để trống nếu đây là URL chính thức của nội dung.">
            {(id) => (
              <input
                id={id}
                type="text"
                value={canonicalUrl}
                onChange={(e) => onCanonicalUrlChange(e.target.value)}
                placeholder="https://..."
                maxLength={CANONICAL_URL_MAX}
                className="admin-input font-mono text-xs"
              />
            )}
          </Field>
        </div>

        {/* Google preview */}
        <div>
          <p className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
            Xem trước trên Google
          </p>
          <div className="rounded-lg p-3.5" style={{ background: "var(--admin-surface-muted)", border: "1px solid var(--admin-border)" }}>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium" style={{ color: "var(--admin-text)" }}>Nan</span>
              {slug && (
                <span className="truncate" style={{ color: "var(--admin-success)" }}>
                  › {slug}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-base" style={{ color: "var(--admin-primary)" }}>
              {previewTitle}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
              {previewDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
