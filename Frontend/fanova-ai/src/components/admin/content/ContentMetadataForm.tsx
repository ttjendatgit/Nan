"use client";

import { useId } from "react";
import { CONTENT_TYPE_VALUES, contentTypeLabel } from "@/lib/contentLabels";
import type { Product } from "@/types/catalog";

const LABEL_CLS = "block text-xs font-medium mb-1.5";
const ERROR_CLS = "mt-1.5 text-[11px] leading-snug";
const HINT_CLS = "mt-1.5 text-[11px] leading-snug";

/** Local to this form, matching the same Field pattern already used in the pricing-rules and
 * options admin pages -- no shared Field component exists yet to import instead. */
function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS} style={{ color: "var(--admin-text-muted)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--admin-danger)" }} aria-hidden="true">*</span>}
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

interface ContentMetadataFormProps {
  mode: "create" | "edit";
  type: string;
  onTypeChange: (type: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  productId: string;
  onProductIdChange: (id: string) => void;
  products: Product[];
  productsLoading: boolean;
  typeError?: string;
  productError?: string;
}

/**
 * Document-level metadata sitting above the Editor/Preview workspace: Type, Slug, and (only when
 * Type is ProductContent) the linked Product. Title is not duplicated here -- it's already
 * editable in the header via TitleInput (Phase 1.6); this form only covers the fields that were
 * genuinely still hardcoded (Type) or never exposed (Slug, Product) before this phase.
 *
 * Type and Product are editable only in "create" mode. Both are immutable on the backend once a
 * document exists (see UpdateContentDocumentRequest, which has no fields for either), so once
 * `documentId` is set, ContentStudio switches this form to "edit" mode and it renders them as
 * plain read-only text instead of a disabled control that looks interactive but isn't.
 */
export default function ContentMetadataForm({
  mode, type, onTypeChange, slug, onSlugChange, productId, onProductIdChange,
  products, productsLoading, typeError, productError,
}: ContentMetadataFormProps) {
  const showProduct = type === "ProductContent";
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="mb-5 rounded-xl p-4" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
      <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        Thông tin nội dung
      </p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Field
          label="Loại nội dung"
          required
          error={typeError}
          hint={mode === "edit" ? "Không thể đổi loại nội dung sau khi tạo." : undefined}
        >
          {(id) =>
            mode === "edit" ? (
              <div id={id} className="admin-input flex items-center" style={{ background: "var(--admin-surface-muted)", color: "var(--admin-text)" }}>
                {contentTypeLabel(type)}
              </div>
            ) : (
              <select id={id} value={type} onChange={(e) => onTypeChange(e.target.value)} className="admin-input">
                {CONTENT_TYPE_VALUES.map((t) => <option key={t} value={t}>{contentTypeLabel(t)}</option>)}
              </select>
            )
          }
        </Field>

        <Field label="Đường dẫn (Slug)" hint="Để trống để tự động tạo từ tiêu đề.">
          {(id) => (
            <input
              id={id}
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="tu-dong-tao-neu-de-trong"
              maxLength={200}
              className="admin-input font-mono text-xs"
            />
          )}
        </Field>

        {showProduct && (
          <Field
            label="Sản phẩm"
            required={mode === "create"}
            error={productError}
            hint={mode === "edit" ? "Không thể đổi sản phẩm sau khi tạo." : undefined}
          >
            {(id) =>
              mode === "edit" ? (
                <div id={id} className="admin-input flex items-center" style={{ background: "var(--admin-surface-muted)", color: "var(--admin-text)" }}>
                  {productsLoading ? "Đang tải…" : (selectedProduct?.name ?? "Không xác định")}
                </div>
              ) : (
                <select
                  id={id}
                  value={productId}
                  onChange={(e) => onProductIdChange(e.target.value)}
                  disabled={productsLoading}
                  className="admin-input"
                >
                  <option value="">{productsLoading ? "Đang tải danh sách sản phẩm..." : "— Chọn sản phẩm —"}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{!p.isActive ? " (Đã ẩn)" : ""}</option>
                  ))}
                </select>
              )
            }
          </Field>
        )}
      </div>
    </div>
  );
}
