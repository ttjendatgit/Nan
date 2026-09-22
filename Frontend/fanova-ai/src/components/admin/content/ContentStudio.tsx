"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContentDocument, updateContentDocument } from "@/lib/api/contentDocuments";
import { getProducts } from "@/lib/api/products";
import { parseBlocksJson } from "@/types/contentBlocks";
import { useContentEditor } from "@/hooks/useContentEditor";
import type { ContentDocument } from "@/types/content";
import type { Product } from "@/types/catalog";
import ContentStudioHeader from "./ContentStudioHeader";
import ContentMetadataForm from "./ContentMetadataForm";
import EditorPanel from "./EditorPanel";
import PreviewPanel from "./PreviewPanel";

interface ContentStudioProps {
  token: string;
  /** Null for a document that has never been saved (the /new route). Once a save succeeds it
   * becomes the real id and ContentStudio redirects to /admin/content/{id}. */
  documentId: string | null;
  initialTitle: string;
  initialStatus: string;
  /** Select default for a new document ("Page"); the real value once a document exists. */
  initialType: string;
  initialProductId: string | null;
  initialSlug: string | null;
  /** Draft-preferred content to load into the editor (draftBlocksJson, falling back to
   * blocksJson, falling back to nothing) -- resolved by the caller, since which field wins is
   * ContentDocument-specific knowledge, not something this generic workspace needs to know. */
  initialEditableBlocksJson: string | null;
  /** The document's own BlocksJson field, unresolved -- tracked separately so a "Save draft"
   * can send it back unchanged instead of overwriting published content with draft content. */
  initialPublishedBlocksJson: string | null;
}

type Notice = { type: "success" | "error"; text: string };
type MetadataErrors = { type?: string; productId?: string };

/**
 * Main workspace layout and orchestrator: header (back nav + title + status + dirty indicator +
 * Save/Publish), document metadata (Type/Slug/Product), and a two-panel Editor/Preview area.
 * Block-editing mechanics live in useContentEditor; this component owns document-level concerns
 * -- title, metadata, save/publish persistence, dirty-aware back navigation, and (for a
 * brand-new document) the redirect to the document's real URL once the first save succeeds.
 */
export default function ContentStudio({
  token, documentId: initialDocumentId, initialTitle, initialStatus,
  initialType, initialProductId, initialSlug,
  initialEditableBlocksJson, initialPublishedBlocksJson,
}: ContentStudioProps) {
  const router = useRouter();

  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);
  const [documentType, setDocumentType] = useState(initialType);
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [publishedBlocksJson, setPublishedBlocksJson] = useState(initialPublishedBlocksJson);

  // Type is immutable once a document exists (matches the backend's UpdateContentDocumentRequest,
  // which has no field for it) -- as soon as the first save gives us a real documentId,
  // ContentMetadataForm switches Type/Product to read-only automatically.
  const metadataMode: "create" | "edit" = documentId ? "edit" : "create";

  const initialParsed = parseBlocksJson(initialEditableBlocksJson);
  const editor = useContentEditor(initialParsed.blocks);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [metadataErrors, setMetadataErrors] = useState<MetadataErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(
    initialParsed.error ? { type: "error", text: initialParsed.error } : null,
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setProductsLoading(true);
      try {
        const result = await getProducts({ pageSize: 100, activeOnly: false }, token);
        if (!cancelled) setProducts(result.items);
      } catch {
        // Non-fatal: the Product select just degrades to empty / "Không xác định" -- nothing
        // else in the workspace depends on this list.
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [token]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (titleError) setTitleError(null);
    editor.markDirty();
  }

  function handleTypeChange(value: string) {
    setDocumentType(value);
    // A product picked for the old type is meaningless (and rejected by the backend) once Type
    // is no longer ProductContent.
    if (value !== "ProductContent") setProductId("");
    if (metadataErrors.type) setMetadataErrors((prev) => ({ ...prev, type: undefined }));
    editor.markDirty();
  }

  function handleProductIdChange(value: string) {
    setProductId(value);
    if (metadataErrors.productId) setMetadataErrors((prev) => ({ ...prev, productId: undefined }));
    editor.markDirty();
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    editor.markDirty();
  }

  function handleBack() {
    if (editor.dirty) {
      const confirmed = window.confirm(
        "Bạn có thay đổi chưa lưu. Nếu rời khỏi trang này, các thay đổi sẽ bị mất. Bạn có chắc chắn muốn rời đi?",
      );
      if (!confirmed) return;
    }
    router.push("/admin/content");
  }

  function applyPersistedDocument(doc: ContentDocument) {
    setDocumentId(doc.id);
    setSlug(doc.slug);
    setDocumentType(doc.type);
    setProductId(doc.productId ?? "");
    setStatus(doc.status);
    setPublishedBlocksJson(doc.blocksJson ?? null);
  }

  /** Title required (≤200 chars), Type required, Product required when Type is ProductContent --
   * mirrors the backend's own validators so an obviously-invalid request is never sent. */
  function validate(trimmedTitle: string): boolean {
    let valid = true;

    if (!trimmedTitle) {
      setTitleError("Vui lòng nhập tiêu đề trước khi lưu.");
      valid = false;
    } else if (trimmedTitle.length > 200) {
      setTitleError("Tiêu đề tối đa 200 ký tự.");
      valid = false;
    } else {
      setTitleError(null);
    }

    const errors: MetadataErrors = {};
    if (!documentType) {
      errors.type = "Vui lòng chọn loại nội dung.";
      valid = false;
    }
    if (documentType === "ProductContent" && !productId) {
      errors.productId = "Vui lòng chọn sản phẩm.";
      valid = false;
    }
    setMetadataErrors(errors);

    return valid;
  }

  async function persist(params: {
    status: string;
    blocksJson: string | null;
    draftBlocksJson: string | null;
    successMessage: string;
  }) {
    const trimmedTitle = title.trim();
    if (!validate(trimmedTitle)) return;

    setSaving(true);
    setNotice(null);
    try {
      const trimmedSlug = slug.trim() || null;
      let saved: ContentDocument;
      if (documentId) {
        saved = await updateContentDocument(documentId, {
          title: trimmedTitle,
          slug: trimmedSlug,
          status: params.status,
          blocksJson: params.blocksJson,
          draftBlocksJson: params.draftBlocksJson,
        }, token);
      } else {
        saved = await createContentDocument({
          type: documentType,
          productId: documentType === "ProductContent" ? (productId || null) : null,
          title: trimmedTitle,
          slug: trimmedSlug,
          status: params.status,
          blocksJson: params.blocksJson,
          draftBlocksJson: params.draftBlocksJson,
        }, token);
      }

      const wasNew = !documentId;
      applyPersistedDocument(saved);
      editor.clearDirty();
      setNotice({ type: "success", text: params.successMessage });

      if (wasNew) {
        router.replace(`/admin/content/${saved.id}`);
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Không thể lưu nội dung. Vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSaveDraft() {
    return persist({
      status: "Draft",
      // Unchanged: a draft save must never silently overwrite what's actually published.
      blocksJson: publishedBlocksJson,
      draftBlocksJson: editor.serializeBlocks(),
      successMessage: "Đã lưu bản nháp.",
    });
  }

  function handlePublish() {
    return persist({
      status: "Published",
      blocksJson: editor.serializeBlocks(),
      draftBlocksJson: null,
      successMessage: "Đã xuất bản nội dung.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" style={{ color: "var(--admin-text)" }}>
      <ContentStudioHeader
        title={title}
        onTitleChange={handleTitleChange}
        titleError={titleError ?? undefined}
        status={status}
        dirty={editor.dirty}
        saving={saving}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <ContentMetadataForm
        mode={metadataMode}
        type={documentType}
        onTypeChange={handleTypeChange}
        slug={slug}
        onSlugChange={handleSlugChange}
        productId={productId}
        onProductIdChange={handleProductIdChange}
        products={products}
        productsLoading={productsLoading}
        typeError={metadataErrors.type}
        productError={metadataErrors.productId}
      />

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-xs"
          style={{
            border: notice.type === "success" ? "1px solid rgba(21,128,61,0.22)" : "1px solid rgba(220,38,38,0.22)",
            background: notice.type === "success" ? "var(--admin-success-soft)" : "var(--admin-danger-soft)",
            color: notice.type === "success" ? "var(--admin-success)" : "var(--admin-danger)",
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <p className="flex-1">{notice.text}</p>
          <button
            onClick={() => setNotice(null)}
            aria-label="Đóng thông báo"
            className="admin-focus-ring shrink-0 rounded"
            style={{ color: "inherit" }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Desktop (lg, 1024px+): Editor | Preview side by side.
          Tablet and mobile (< 1024px): stacked, matching how the admin shell itself switches
          from the mobile top bar to the fixed sidebar at the same lg breakpoint. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EditorPanel
          blocks={editor.blocks}
          onAddBlock={editor.addBlock}
          onUpdateBlock={editor.updateBlock}
          onRemoveBlock={editor.removeBlock}
          onMoveBlock={editor.moveBlock}
        />
        <PreviewPanel blocks={editor.blocks} />
      </div>
    </div>
  );
}
