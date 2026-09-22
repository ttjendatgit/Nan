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

export type HeadingLevel = "h1" | "h2" | "h3";

export interface HeadingBlock {
  type: "heading";
  id: string;
  level: HeadingLevel;
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  id: string;
  text: string;
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
}

/**
 * The block union. To add a new block type: add its interface here, add it to this union, then
 * follow the compile errors -- CONTENT_BLOCK_TYPES, CONTENT_BLOCK_LABELS, the factory switch, the
 * BlockItem dispatch switch, and the BlockRenderer dispatch switch are all written as exhaustive
 * switches with no `default` case, so TypeScript refuses to compile until every one of them
 * handles the new type.
 */
export type ContentBlock = HeadingBlock | ParagraphBlock | QuoteBlock | DividerBlock | ImageBlock;

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
  }
}

// ─── Display metadata ───────────────────────────────────────────────────────

export const CONTENT_BLOCK_TYPES: readonly ContentBlockType[] = ["heading", "paragraph", "quote", "divider", "image"];

const CONTENT_BLOCK_LABELS: Record<ContentBlockType, string> = {
  heading: "Tiêu đề",
  paragraph: "Đoạn văn",
  quote: "Trích dẫn",
  divider: "Đường kẻ",
  image: "Hình ảnh",
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

  switch (v.type) {
    case "heading": {
      const level = v.level === "h1" || v.level === "h2" || v.level === "h3" ? v.level : "h2";
      return { type: "heading", id, level, text: asString(v.text) };
    }
    case "paragraph":
      return { type: "paragraph", id, text: asString(v.text) };
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
      };
    default:
      return null;
  }
}
