"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContentDocument, updateContentDocument } from "@/lib/api/contentDocuments";
import { getProducts } from "@/lib/api/products";
import { createParagraphBlock, parseBlocksJson } from "@/types/contentBlocks";
import type { ParagraphBlock } from "@/types/contentBlocks";
import { useContentEditor } from "@/hooks/useContentEditor";
import type { ContentDocument } from "@/types/content";
import type { Product } from "@/types/catalog";
import type { ParagraphBackspacePayload, ParagraphEnterPayload } from "./editor/RichTextInput";
import ContentStudioHeader from "./ContentStudioHeader";
import ContentMetadataForm from "./ContentMetadataForm";
import SeoPanel, { type SeoErrors } from "./SeoPanel";
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
  initialSeoTitle: string | null;
  initialSeoDescription: string | null;
  initialSeoKeywords: string | null;
  initialSeoImageUrl: string | null;
  initialCanonicalUrl: string | null;
}

type Notice = { type: "success" | "error"; text: string };
type MetadataErrors = { type?: string; productId?: string };

function isValidAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

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
  initialSeoTitle, initialSeoDescription, initialSeoKeywords, initialSeoImageUrl, initialCanonicalUrl,
}: ContentStudioProps) {
  const router = useRouter();

  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);
  const [documentType, setDocumentType] = useState(initialType);
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [publishedBlocksJson, setPublishedBlocksJson] = useState(initialPublishedBlocksJson);

  const [seoTitle, setSeoTitle] = useState(initialSeoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(initialSeoKeywords ?? "");
  const [seoImageUrl, setSeoImageUrl] = useState(initialSeoImageUrl ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialCanonicalUrl ?? "");
  const [seoErrors, setSeoErrors] = useState<SeoErrors>({});

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

  function handleSeoTitleChange(value: string) {
    setSeoTitle(value);
    if (seoErrors.seoTitle) setSeoErrors((prev) => ({ ...prev, seoTitle: undefined }));
    editor.markDirty();
  }

  function handleSeoDescriptionChange(value: string) {
    setSeoDescription(value);
    if (seoErrors.seoDescription) setSeoErrors((prev) => ({ ...prev, seoDescription: undefined }));
    editor.markDirty();
  }

  function handleSeoKeywordsChange(value: string) {
    setSeoKeywords(value);
    if (seoErrors.seoKeywords) setSeoErrors((prev) => ({ ...prev, seoKeywords: undefined }));
    editor.markDirty();
  }

  function handleSeoImageUrlChange(value: string) {
    setSeoImageUrl(value);
    if (seoErrors.seoImageUrl) setSeoErrors((prev) => ({ ...prev, seoImageUrl: undefined }));
    editor.markDirty();
  }

  function handleCanonicalUrlChange(value: string) {
    setCanonicalUrl(value);
    if (seoErrors.canonicalUrl) setSeoErrors((prev) => ({ ...prev, canonicalUrl: undefined }));
    editor.markDirty();
  }

  /**
   * A1: what a plain Enter inside a ParagraphBlock does now, reversing the SingleParagraphEnter
   * decision from Phase 2.3.1. Owns the actual block-array decision RichTextInput's payload only
   * describes -- RichTextInput doesn't know about the block array at all, it just reports where
   * the cursor was and what was on each side of it.
   *
   * `atStart` is checked before the after===null/after!==null split on purpose: an empty
   * paragraph (nothing typed yet) has the cursor at both "the start" and "the end" of its content
   * simultaneously, and in that case "add an empty block above, don't move focus" is the more
   * useful reading of pressing Enter than "split off nothing and jump away."
   */
  function handleParagraphEnter(blockId: string, index: number, payload: ParagraphEnterPayload) {
    const { before, after, atStart } = payload;

    if (atStart) {
      editor.addBlockAt("paragraph", index);
      return;
    }

    const currentBlock = editor.blocks.find((b) => b.id === blockId);
    if (!currentBlock || currentBlock.type !== "paragraph") return; // onEnter is only ever wired for paragraph blocks

    editor.updateBlock({ ...currentBlock, text: before });

    if (after === null) {
      const newId = editor.addBlockAt("paragraph", index + 1);
      editor.requestFocus(newId);
      return;
    }

    // Carries the split-off content over, plus the original block's own alignment (a fresh
    // createParagraphBlock() always starts unaligned/left -- the new block is a continuation of
    // the same paragraph, so it should keep reading the same way, not reset to the default).
    const splitBlock: ParagraphBlock = { ...createParagraphBlock(), text: after, align: currentBlock.align };
    editor.insertBlockAt(splitBlock, index + 1);
    editor.requestFocus(splitBlock.id);
  }

  /**
   * A2: what a plain Backspace at the very start of a ParagraphBlock does -- Enter's inverse.
   * RichTextInput only ever reports state (is this block empty, and its full current doc); every
   * decision about what that means for the block array is made here, same division of
   * responsibility as handleParagraphEnter above.
   *
   * The actual content merge does NOT happen here as a JSON splice -- `editor.requestMerge(prev.id,
   * doc)` only records the intent (which block, what's incoming). The previous block's own
   * RichTextInput picks that up via its `pendingMerge` prop and performs the splice inside its own
   * live TipTap editor, where the join-point cursor position is just "wherever the insert landed"
   * rather than a number this component would have to compute by hand from raw JSON -- see the
   * `pendingMerge` effect in RichTextInput.tsx for why that matters.
   *
   * requestMerge is called before removeBlock on purpose: the target block must stay mounted and
   * rendered throughout, since its own effect is what performs the splice -- removing it first
   * (or removing the source block first, though order between removeBlock and requestMerge here
   * doesn't itself matter) is not what's being guarded against; unmounting the *target* before its
   * merge effect runs is.
   */
  function handleParagraphBackspace(blockId: string, index: number, payload: ParagraphBackspacePayload) {
    if (index === 0) return; // no previous block to delete into or merge with

    const prev = editor.blocks[index - 1];
    if (!prev) return;

    if (payload.isEmpty) {
      editor.removeBlock(blockId);
      // Only a paragraph has meaningful "end of content" to land the cursor in -- landing focus
      // on an image/heading/etc. isn't part of this task's scope, so it's simply skipped, leaving
      // focus wherever it already was (mirrors A1's atStart case, which also sometimes leaves
      // focus untouched rather than forcing it somewhere).
      if (prev.type === "paragraph") editor.requestFocus(prev.id, "end");
      return;
    }

    if (prev.type !== "paragraph") return; // don't merge text into a non-paragraph block

    editor.requestMerge(prev.id, payload.doc);
    editor.removeBlock(blockId);
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
    setSeoTitle(doc.seoTitle ?? "");
    setSeoDescription(doc.seoDescription ?? "");
    setSeoKeywords(doc.seoKeywords ?? "");
    setSeoImageUrl(doc.seoImageUrl ?? "");
    setCanonicalUrl(doc.canonicalUrl ?? "");
  }

  /** Title required (≤200 chars), Type required, Product required when Type is ProductContent,
   * SEO Image URL/Canonical URL must be a valid absolute URL when provided -- mirrors the
   * backend's own validators so an obviously-invalid request is never sent. */
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

    const nextSeoErrors: SeoErrors = {};
    if (seoImageUrl.trim() && !isValidAbsoluteUrl(seoImageUrl.trim())) {
      nextSeoErrors.seoImageUrl = "SEO Image URL phải là một đường dẫn hợp lệ.";
      valid = false;
    }
    if (canonicalUrl.trim() && !isValidAbsoluteUrl(canonicalUrl.trim())) {
      nextSeoErrors.canonicalUrl = "Canonical URL phải là một đường dẫn hợp lệ.";
      valid = false;
    }
    setSeoErrors(nextSeoErrors);

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
      const seoFields = {
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywords.trim() || null,
        seoImageUrl: seoImageUrl.trim() || null,
        canonicalUrl: canonicalUrl.trim() || null,
      };

      let saved: ContentDocument;
      if (documentId) {
        saved = await updateContentDocument(documentId, {
          title: trimmedTitle,
          slug: trimmedSlug,
          status: params.status,
          blocksJson: params.blocksJson,
          draftBlocksJson: params.draftBlocksJson,
          ...seoFields,
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
          ...seoFields,
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

      <SeoPanel
        seoTitle={seoTitle}
        onSeoTitleChange={handleSeoTitleChange}
        seoDescription={seoDescription}
        onSeoDescriptionChange={handleSeoDescriptionChange}
        seoKeywords={seoKeywords}
        onSeoKeywordsChange={handleSeoKeywordsChange}
        seoImageUrl={seoImageUrl}
        onSeoImageUrlChange={handleSeoImageUrlChange}
        canonicalUrl={canonicalUrl}
        onCanonicalUrlChange={handleCanonicalUrlChange}
        fallbackTitle={title}
        slug={slug}
        errors={seoErrors}
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
          token={token}
          pendingFocus={editor.pendingFocus}
          requestFocus={editor.requestFocus}
          pendingMerge={editor.pendingMerge}
          clearMerge={editor.clearMerge}
          onParagraphEnter={handleParagraphEnter}
          onParagraphBackspace={handleParagraphBackspace}
        />
        <PreviewPanel blocks={editor.blocks} />
      </div>
    </div>
  );
}
