"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { ContentBlock } from "@/types/contentBlocks";
import { contentBlockLabel } from "@/types/contentBlocks";
import type { TipTapDocument } from "@/lib/tiptapContent";
import type { ParagraphBackspacePayload, ParagraphEnterPayload, ParagraphPastePayload } from "./RichTextInput";
import HeadingBlockEditor from "./blocks/HeadingBlockEditor";
import ParagraphBlockEditor from "./blocks/ParagraphBlockEditor";
import QuoteBlockEditor from "./blocks/QuoteBlockEditor";
import DividerBlockEditor from "./blocks/DividerBlockEditor";
import ImageBlockEditor from "./blocks/ImageBlockEditor";
import ListBlockEditor from "./blocks/ListBlockEditor";
import GalleryBlockEditor from "./blocks/GalleryBlockEditor";
import CalloutBlockEditor from "./blocks/CalloutBlockEditor";

const ICON_BTN =
  "admin-focus-ring flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none";

interface BlockItemProps {
  block: ContentBlock;
  index: number;
  total: number;
  active: boolean;
  onFocus: () => void;
  onChange: (block: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Only ImageBlockEditor actually needs this (to open the Media Picker) -- threaded through
   * here rather than via context, matching how every other admin surface in this app passes the
   * auth token explicitly. */
  token: string;
  /** A1/A2: only meaningful for a "paragraph" block -- BlockFields only forwards these to
   * ParagraphBlockEditor; every other block type's editor simply never receives them. */
  onEnter?: (payload: ParagraphEnterPayload) => void;
  onBackspaceAtStart?: (payload: ParagraphBackspacePayload) => void;
  autoFocus?: false | "start" | "end";
  pendingMerge?: TipTapDocument | null;
  onMergeApplied?: () => void;
  onPasteBlocks?: (payload: ParagraphPastePayload) => void;
}

/** Shared chrome (border/hover/active + reorder/remove actions) around one block's type-specific
 * editor. Reordering uses plain up/down buttons, not a drag-and-drop library (out of scope). */
export default function BlockItem({
  block, index, total, active, onFocus, onChange, onRemove, onMoveUp, onMoveDown, token,
  onEnter, onBackspaceAtStart, autoFocus, pendingMerge, onMergeApplied, onPasteBlocks,
}: BlockItemProps) {
  const label = contentBlockLabel(block.type);

  return (
    <div
      role="listitem"
      onFocusCapture={onFocus}
      className="rounded-lg p-3.5 transition-colors"
      style={{
        border: active ? "1px solid var(--admin-primary)" : "1px solid var(--admin-border)",
        background: active ? "var(--admin-primary-soft)" : "var(--admin-surface)",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border-strong)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border)"; }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-subtle)" }}>
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Di chuyển khối "${label}" lên trên`}
            className={ICON_BTN}
            style={{ color: "var(--admin-text-subtle)" }}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Di chuyển khối "${label}" xuống dưới`}
            className={ICON_BTN}
            style={{ color: "var(--admin-text-subtle)" }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Xóa khối "${label}"`}
            className={`${ICON_BTN} hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]`}
            style={{ color: "var(--admin-text-subtle)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <BlockFields
        block={block} onChange={onChange} token={token}
        onEnter={onEnter} onBackspaceAtStart={onBackspaceAtStart}
        autoFocus={autoFocus} pendingMerge={pendingMerge} onMergeApplied={onMergeApplied}
        onPasteBlocks={onPasteBlocks}
      />
    </div>
  );
}

/** Dispatches to the right type-specific editor. Exhaustive switch, no `default`: a new
 * ContentBlockType without a case here is a compile error. The A1/A2/A3 props are only ever
 * passed to ParagraphBlockEditor -- every other case ignores them, which is what "other blocks
 * ignore these props" means in practice: there's simply no plumbing to them. */
function BlockFields({
  block, onChange, token, onEnter, onBackspaceAtStart, autoFocus, pendingMerge, onMergeApplied, onPasteBlocks,
}: {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  token: string;
  onEnter?: (payload: ParagraphEnterPayload) => void;
  onBackspaceAtStart?: (payload: ParagraphBackspacePayload) => void;
  autoFocus?: false | "start" | "end";
  pendingMerge?: TipTapDocument | null;
  onMergeApplied?: () => void;
  onPasteBlocks?: (payload: ParagraphPastePayload) => void;
}) {
  switch (block.type) {
    case "heading":
      return <HeadingBlockEditor block={block} onChange={onChange} />;
    case "paragraph":
      return (
        <ParagraphBlockEditor
          block={block} onChange={onChange}
          onEnter={onEnter} onBackspaceAtStart={onBackspaceAtStart}
          autoFocus={autoFocus} pendingMerge={pendingMerge} onMergeApplied={onMergeApplied}
          onPasteBlocks={onPasteBlocks}
        />
      );
    case "quote":
      return <QuoteBlockEditor block={block} onChange={onChange} />;
    case "divider":
      return <DividerBlockEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} token={token} />;
    case "list":
      return <ListBlockEditor block={block} onChange={onChange} />;
    case "gallery":
      return <GalleryBlockEditor block={block} onChange={onChange} token={token} />;
    case "callout":
      return <CalloutBlockEditor block={block} onChange={onChange} />;
  }
}
