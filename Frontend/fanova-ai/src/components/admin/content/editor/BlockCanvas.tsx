"use client";

import { LayoutList } from "lucide-react";
import type { ContentBlock } from "@/types/contentBlocks";
import type { ParagraphEnterPayload } from "./RichTextInput";
import BlockItem from "./BlockItem";

interface BlockCanvasProps {
  blocks: ContentBlock[];
  activeBlockId: string | null;
  onFocusBlock: (id: string) => void;
  onUpdateBlock: (block: ContentBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: -1 | 1) => void;
  token: string;
  /** A1: which block (if any) should auto-focus on this render -- state owned by useContentEditor
   * via ContentStudio, threaded all the way down here since this is the component that actually
   * knows each block's id to compare against it. */
  pendingFocusBlockId: string | null;
  requestFocus: (blockId: string | null) => void;
  /** Raw split payload from a paragraph's RichTextInput, plus which block/index it came from --
   * BlockCanvas is where `block.id`/`index` are known, so it's the natural place to close over
   * them before handing the payload up to the real handler in ContentStudio. */
  onParagraphEnter: (blockId: string, index: number, payload: ParagraphEnterPayload) => void;
}

export default function BlockCanvas({
  blocks, activeBlockId, onFocusBlock, onUpdateBlock, onRemoveBlock, onMoveBlock, token,
  pendingFocusBlockId, requestFocus, onParagraphEnter,
}: BlockCanvasProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-10 text-center" style={{ borderColor: "var(--admin-border-strong)" }}>
        <LayoutList className="mx-auto h-6 w-6" style={{ color: "var(--admin-text-subtle)" }} strokeWidth={1.25} aria-hidden="true" />
        <p className="mt-2.5 text-xs leading-relaxed" style={{ color: "var(--admin-text-subtle)" }}>
          Chưa có khối nội dung nào. Chọn một loại ở trên để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" role="list" aria-label="Danh sách khối nội dung">
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          active={block.id === activeBlockId}
          onFocus={() => {
            onFocusBlock(block.id);
            // The DOM focus event this fires on is the actual signal that a pending auto-focus
            // request landed where it was supposed to -- clearing it here (rather than the moment
            // the request was made) is what keeps it from re-firing on some unrelated later
            // render, per useContentEditor's own contract for requestFocus.
            if (block.id === pendingFocusBlockId) requestFocus(null);
          }}
          onChange={onUpdateBlock}
          onRemove={() => onRemoveBlock(block.id)}
          onMoveUp={() => onMoveBlock(block.id, -1)}
          onMoveDown={() => onMoveBlock(block.id, 1)}
          token={token}
          onEnter={(payload) => onParagraphEnter(block.id, index, payload)}
          autoFocus={block.id === pendingFocusBlockId}
        />
      ))}
    </div>
  );
}
