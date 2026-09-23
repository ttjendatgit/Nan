"use client";

import { LayoutList } from "lucide-react";
import type { ContentBlock } from "@/types/contentBlocks";
import BlockItem from "./BlockItem";

interface BlockCanvasProps {
  blocks: ContentBlock[];
  activeBlockId: string | null;
  onFocusBlock: (id: string) => void;
  onUpdateBlock: (block: ContentBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: -1 | 1) => void;
  token: string;
}

export default function BlockCanvas({ blocks, activeBlockId, onFocusBlock, onUpdateBlock, onRemoveBlock, onMoveBlock, token }: BlockCanvasProps) {
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
          onFocus={() => onFocusBlock(block.id)}
          onChange={onUpdateBlock}
          onRemove={() => onRemoveBlock(block.id)}
          onMoveUp={() => onMoveBlock(block.id, -1)}
          onMoveDown={() => onMoveBlock(block.id, 1)}
          token={token}
        />
      ))}
    </div>
  );
}
