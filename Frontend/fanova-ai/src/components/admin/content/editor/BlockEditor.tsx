"use client";

import { useState } from "react";
import type { ContentBlock, ContentBlockType } from "@/types/contentBlocks";
import type { ParagraphEnterPayload } from "./RichTextInput";
import BlockToolbar from "./BlockToolbar";
import BlockCanvas from "./BlockCanvas";

interface BlockEditorProps {
  blocks: ContentBlock[];
  onAddBlock: (type: ContentBlockType) => ContentBlock;
  onUpdateBlock: (block: ContentBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: -1 | 1) => void;
  token: string;
  /** A1: owned by useContentEditor via ContentStudio -- BlockEditor has nothing to add here, it
   * just carries these three through to BlockCanvas alongside its own local activeBlockId. */
  pendingFocusBlockId: string | null;
  requestFocus: (blockId: string | null) => void;
  onParagraphEnter: (blockId: string, index: number, payload: ParagraphEnterPayload) => void;
}

/**
 * Composes the toolbar (add) and canvas (list/update/remove/reorder) into one editing surface.
 * All block mutations are owned by useContentEditor (via ContentStudio) and passed in as props --
 * BlockEditor itself is presentation only. `activeBlockId` is the one piece of state it keeps
 * locally, since it's pure UI ("which block reads as focused") that nothing outside this
 * component needs to know about.
 */
export default function BlockEditor({
  blocks, onAddBlock, onUpdateBlock, onRemoveBlock, onMoveBlock, token,
  pendingFocusBlockId, requestFocus, onParagraphEnter,
}: BlockEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  function handleAddBlock(type: ContentBlockType) {
    const newBlock = onAddBlock(type);
    setActiveBlockId(newBlock.id);
  }

  function handleRemoveBlock(id: string) {
    onRemoveBlock(id);
    setActiveBlockId((current) => (current === id ? null : current));
  }

  return (
    <div className="flex flex-col gap-4">
      <BlockToolbar onAddBlock={handleAddBlock} />
      <BlockCanvas
        blocks={blocks}
        activeBlockId={activeBlockId}
        onFocusBlock={setActiveBlockId}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={handleRemoveBlock}
        onMoveBlock={onMoveBlock}
        token={token}
        pendingFocusBlockId={pendingFocusBlockId}
        requestFocus={requestFocus}
        onParagraphEnter={onParagraphEnter}
      />
    </div>
  );
}
