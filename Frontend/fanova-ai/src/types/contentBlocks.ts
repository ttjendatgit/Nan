/**
 * Block schema for the new, unified Content Studio editor -- meant to eventually back Product
 * content, static pages, blog posts, and landing pages alike.
 *
 * Deliberately separate from the legacy `ContentBlock` union in `types/catalog.ts` (the shape
 * `ContentBlockEditor`/`Product.ContentBlocksJson` already use -- no `id` field, different type
 * names, align/tone/weight styling options). That editor and its data are untouched by this
 * phase; this schema does not need to be compatible with its JSON shape. How the two schemas
 * eventually reconcile (if ever) is a decision for a later phase, not this one.
 *
 * Each block is a plain, JSON-serializable object -- easy to persist as-is once a later phase
 * wires this up to ContentDocument.BlocksJson/DraftBlocksJson.
 */

import { sanitizeRichText } from "@/lib/richText";
import { isTipTapDocument, type TipTapDocument } from "@/lib/tiptapContent";

export type { TipTapDocument };

export type HeadingLevel = "h1" | "h2" | "h3";

export interface HeadingBlock {
  type: "heading";
  id: string;
  level: HeadingLevel;
  text: string;
}

export type BlockAlign = "left" | "center" | "right";

export interface ParagraphBlock {
  type: "paragraph";
  id: string;
  /**
   * Two valid shapes, both handled by RichTextRenderer (components/content/RichTextRenderer.tsx):
   *   - `string` -- plain text, or the constrained inline-HTML subset (b/strong, i/em, a[href],
   *     br) Phase 2.1's editor produced. Every ParagraphBlock saved before Phase 2.3.1 is this
   *     shape. Still sanitized via lib/richText.ts wherever it's read -- never trusted on its own.
   *   - `TipTapDocument` (added Phase 2.3.1) -- TipTap's own JSONContent doc shape, produced by
   *     RichTextInput.tsx. Structural nodes/marks only, never an HTML string -- see
   *     lib/tiptapContent.ts for what "valid" means here and why storing JSON instead of HTML was
   *     the point of this phase.
   * A block only ever moves string -> TipTapDocument, one-way, the first time someone edits it in
   * the new editor (RichTextInput re-parses an incoming string through its own schema and renders
   * it identically; it doesn't rewrite `text` until an actual edit happens). Old data is never
   * migrated in the database -- see contentSchemaNotes.md.
   */
  text: string | TipTapDocument;
  /** Optional, added Phase 2.2. Omitted entirely on every block saved before this phase, which
   * is fine: the renderer treats a missing value as "left", the same as browser default text
   * alignment those blocks already rendered with -- no visual change for old data. */
  align?: BlockAlign;
}

export interface QuoteBlock {
  type: "quote";
  id: string;
  text: string;
}

export interface DividerBlock {
  type: "divider";
  id: string;
}

export interface ImageBlock {
  type: "image";
  id: string;
  url: string;
  alt: string;
  /** Optional caption shown under the image. Added Phase 1.8 -- omitted entirely on older
   * serialized blocks, which is fine: it's optional, so nothing that wrote a block without it
   * needs to change. See contentSchemaNotes.md for the (not yet implemented) `source` field this
   * paves the way for once upload/Cloudinary support exists. */
  caption?: string;
  /** Optional, added Phase 2.2. Missing/undefined renders exactly as every pre-2.2 image block
   * already did (full-width) -- "center" is defined to mean the same thing, so no behavior
   * changes for old data. Only "left"/"right" visibly differ (a narrower, side-aligned image). */
  align?: BlockAlign;
}

export type ListStyle = "bullet" | "ordered";

/** New block type, Phase 2.2. A simple flat list -- no nesting, no per-item rich text, matching
 * every other block's plain-content scope (Quote, Callout). */
export interface ListBlock {
  type: "list";
  id: string;
  style: ListStyle;
  items: string[];
}

export interface GalleryImage {
  url: string;
  alt: string;
}

/** New block type, Phase 2.2. Deliberately its own `images: GalleryImage[]` rather than reusing
 * ImageBlock -- a gallery item only ever needs url+alt (no per-image caption/align), and giving
 * it ImageBlock's full shape would invite fields that make no sense in a grid. */
export interface GalleryBlock {
  type: "gallery";
  id: string;
  images: GalleryImage[];
}

export type CalloutTone = "info" | "success" | "warning";

/** New block type, Phase 2.2. Plain title + plain text (no rich text) -- same scope decision as
 * QuoteBlock; a callout is a short highlighted note, not a place for inline formatting. */
export interface CalloutBlock {
  type: "callout";
  id: string;
  tone: CalloutTone;
  title: string;
  text: string;
}

/**
 * The block union. To add a new block type: add its interface here, add it to this union, then
 * follow the compile errors -- CONTENT_BLOCK_TYPES, CONTENT_BLOCK_LABELS, the factory switch, the
 * BlockItem dispatch switch, and the BlockRenderer dispatch switch are all written as exhaustive
 * switches with no `default` case, so TypeScript refuses to compile until every one of them
 * handles the new type.
 */
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | DividerBlock
  | ImageBlock
  | ListBlock
  | GalleryBlock
  | CalloutBlock;

export type ContentBlockType = ContentBlock["type"];

// ─── Type guards ────────────────────────────────────────────────────────────

export function isHeadingBlock(block: ContentBlock): block is HeadingBlock {
  return block.type === "heading";
}

export function isParagraphBlock(block: ContentBlock): block is ParagraphBlock {
  return block.type === "paragraph";
}

export function isQuoteBlock(block: ContentBlock): block is QuoteBlock {
  return block.type === "quote";
}

export function isDividerBlock(block: ContentBlock): block is DividerBlock {
  return block.type === "divider";
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === "image";
}

export function isListBlock(block: ContentBlock): block is ListBlock {
  return block.type === "list";
}

export function isGalleryBlock(block: ContentBlock): block is GalleryBlock {
  return block.type === "gallery";
}

export function isCalloutBlock(block: ContentBlock): block is CalloutBlock {
  return block.type === "callout";
}

// ─── Id generation ──────────────────────────────────────────────────────────

function generateBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older browsers) -- still unique enough
  // for a client-only, non-persisted editing session.
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Factories ──────────────────────────────────────────────────────────────
// Each factory produces a fresh block with a new id and sensible empty defaults.

export function createHeadingBlock(level: HeadingLevel = "h2"): HeadingBlock {
  return { type: "heading", id: generateBlockId(), level, text: "" };
}

export function createParagraphBlock(): ParagraphBlock {
  return { type: "paragraph", id: generateBlockId(), text: "" };
}

export function createQuoteBlock(): QuoteBlock {
  return { type: "quote", id: generateBlockId(), text: "" };
}

export function createDividerBlock(): DividerBlock {
  return { type: "divider", id: generateBlockId() };
}

export function createImageBlock(): ImageBlock {
  return { type: "image", id: generateBlockId(), url: "", alt: "", caption: "" };
}

// A fresh list starts with one empty item (rather than []) so the editor immediately shows an
// editable row instead of just an "add item" button with nothing to look at.
export function createListBlock(): ListBlock {
  return { type: "list", id: generateBlockId(), style: "bullet", items: [""] };
}

export function createGalleryBlock(): GalleryBlock {
  return { type: "gallery", id: generateBlockId(), images: [] };
}

export function createCalloutBlock(): CalloutBlock {
  return { type: "callout", id: generateBlockId(), tone: "info", title: "", text: "" };
}

/** Dispatches to the right factory by type -- what BlockToolbar calls. Exhaustive switch, no
 * `default`: adding a new ContentBlockType without a case here is a compile error. */
export function createBlock(type: ContentBlockType): ContentBlock {
  switch (type) {
    case "heading":
      return createHeadingBlock();
    case "paragraph":
      return createParagraphBlock();
    case "quote":
      return createQuoteBlock();
    case "divider":
      return createDividerBlock();
    case "image":
      return createImageBlock();
    case "list":
      return createListBlock();
    case "gallery":
      return createGalleryBlock();
    case "callout":
      return createCalloutBlock();
  }
}

// ─── Display metadata ───────────────────────────────────────────────────────

export const CONTENT_BLOCK_TYPES: readonly ContentBlockType[] =
  ["heading", "paragraph", "quote", "divider", "image", "list", "gallery", "callout"];

const CONTENT_BLOCK_LABELS: Record<ContentBlockType, string> = {
  heading: "Tiêu đề",
  paragraph: "Đoạn văn",
  quote: "Trích dẫn",
  divider: "Đường kẻ",
  image: "Hình ảnh",
  list: "Danh sách",
  gallery: "Bộ sưu tập ảnh",
  callout: "Hộp ghi chú",
};

export function contentBlockLabel(type: ContentBlockType): string {
  return CONTENT_BLOCK_LABELS[type];
}

// ─── Parsing ────────────────────────────────────────────────────────────────
// Turns a ContentDocument's BlocksJson/DraftBlocksJson (an opaque string on the backend) back
// into typed blocks. Never throws -- a document with no content, garbage JSON, or blocks from an
// incompatible source (e.g. the legacy ContentBlock shape in types/catalog.ts, which has no `id`
// field) all degrade to an empty or partially-recovered array plus a human-readable warning,
// never a crash.

export interface ParsedBlocksResult {
  blocks: ContentBlock[];
  /** Set when parsing degraded in some way (invalid JSON, wrong shape, or some items were
   * skipped) -- callers should surface this, not silently discard it. Null on a clean parse. */
  error: string | null;
}

export function parseBlocksJson(json: string | null | undefined): ParsedBlocksResult {
  if (!json || !json.trim()) return { blocks: [], error: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { blocks: [], error: "Không thể đọc nội dung đã lưu (JSON không hợp lệ). Đã mở trình soạn thảo trống." };
  }

  if (!Array.isArray(parsed)) {
    return { blocks: [], error: "Không thể đọc nội dung đã lưu (định dạng không đúng). Đã mở trình soạn thảo trống." };
  }

  // A block whose `type` isn't one of ours truly can't be recovered (there is no editor/renderer
  // for it) -- that's the only thing that causes an item to be dropped. Everything else
  // (missing/malformed id, text, level, url, alt) falls back to a sensible default instead of
  // discarding the whole block, so a partially-corrupted or legacy-shaped item still surfaces as
  // *something* editable rather than silently vanishing.
  const blocks: ContentBlock[] = [];
  const seenIds = new Set<string>();
  let skipped = 0;

  for (const item of parsed) {
    const block = coerceContentBlock(item);
    if (!block) {
      skipped++;
      continue;
    }
    // Two blocks can never legitimately share an id (React keys + update/remove/move all key off
    // it) -- reassign rather than drop, since the content itself is still perfectly good.
    if (seenIds.has(block.id)) block.id = generateBlockId();
    seenIds.add(block.id);
    blocks.push(block);
  }

  const error = skipped > 0
    ? `Đã bỏ qua ${skipped} khối nội dung không đúng định dạng khi tải nội dung đã lưu.`
    : null;

  return { blocks, error };
}

/**
 * Validates one parsed JSON item against the ContentBlock shape -- never a blind cast. Returns
 * null only when `type` is missing or unrecognized (nothing to fall back to). Every other field
 * degrades to a safe default instead of rejecting the block outright:
 *   - missing/non-string `id` -> a fresh one is generated
 *   - missing/non-string `text` -> ""
 *   - invalid heading `level` -> "h2" (same default the "add heading" factory uses)
 *   - missing/non-string `url`/`alt`/`caption` -> "" (caption stays undefined if absent, since
 *     it's genuinely optional)
 * This also means a legacy-shaped block (types/catalog.ts's ContentBlock -- no `id`, numeric
 * heading `level`, Cloudinary `secureUrl` instead of `url`) partially recovers: the recognized
 * type and text come through, unmapped/incompatible fields (align, tone, secureUrl, ...) are
 * simply ignored rather than crashing or corrupting the block. See contentSchemaNotes.md.
 */
function coerceContentBlock(value: unknown): ContentBlock | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (typeof v.type !== "string") return null;

  const id = typeof v.id === "string" && v.id.length > 0 ? v.id : generateBlockId();
  const asString = (field: unknown): string => (typeof field === "string" ? field : "");
  // Missing/invalid -> undefined, never a made-up default value -- undefined is itself the
  // meaningful "not set, render as before this field existed" state for both callers.
  const asAlign = (field: unknown): BlockAlign | undefined =>
    field === "left" || field === "center" || field === "right" ? field : undefined;

  switch (v.type) {
    case "heading": {
      const level = v.level === "h1" || v.level === "h2" || v.level === "h3" ? v.level : "h2";
      return { type: "heading", id, level, text: asString(v.text) };
    }
    case "paragraph":
      return { type: "paragraph", id, text: coerceParagraphText(v.text), align: asAlign(v.align) };
    case "quote":
      return { type: "quote", id, text: asString(v.text) };
    case "divider":
      return { type: "divider", id };
    case "image":
      return {
        type: "image",
        id,
        url: asString(v.url),
        alt: asString(v.alt),
        ...(typeof v.caption === "string" ? { caption: v.caption } : {}),
        align: asAlign(v.align),
      };
    case "list": {
      const style: ListStyle = v.style === "ordered" ? "ordered" : "bullet";
      const items = Array.isArray(v.items) ? v.items.filter((item): item is string => typeof item === "string") : [];
      return { type: "list", id, style, items };
    }
    case "gallery": {
      const images = Array.isArray(v.images) ? v.images.map(coerceGalleryImage).filter((img): img is GalleryImage => img !== null) : [];
      return { type: "gallery", id, images };
    }
    case "callout": {
      const tone: CalloutTone = v.tone === "success" || v.tone === "warning" ? v.tone : "info";
      return { type: "callout", id, tone, title: asString(v.title), text: asString(v.text) };
    }
    default:
      return null;
  }
}

/**
 * ParagraphBlock.text's two valid shapes (Phase 2.3.1) get two different treatments:
 *   - a string is the legacy path -- sanitized exactly as before, unchanged behavior.
 *   - a structurally-plausible TipTap doc is trusted as-is here (isTipTapDocument is a shallow
 *     shape check only); RichTextRenderer independently re-validates every node/mark inside it at
 *     render time regardless (unknown types degrade gracefully, hrefs are re-checked) -- the same
 *     "don't rely on one layer alone" posture sanitizeRichText already established for strings.
 * Anything else (a number, an array, an object that isn't doc-shaped) has no safe interpretation
 * as paragraph content, so it falls back to an empty string -- same "invalid -> safe default"
 * convention as every other coerced field in this function.
 */
function coerceParagraphText(value: unknown): string | TipTapDocument {
  if (typeof value === "string") return sanitizeRichText(value);
  if (isTipTapDocument(value)) return value;
  return "";
}

/** A gallery image with no `url` is not recoverable as anything useful (nothing to show) -- that
 * one entry is dropped rather than the whole gallery, matching coerceContentBlock's own
 * "degrade the smallest possible unit" philosophy. */
function coerceGalleryImage(value: unknown): GalleryImage | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.url !== "string" || !v.url) return null;
  return { url: v.url, alt: typeof v.alt === "string" ? v.alt : "" };
}
