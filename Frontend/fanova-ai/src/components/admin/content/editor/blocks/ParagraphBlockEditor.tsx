"use client";

import { useId } from "react";
import type { ParagraphBlock } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

interface ParagraphBlockEditorProps {
  block: ParagraphBlock;
  onChange: (block: ParagraphBlock) => void;
}

export default function ParagraphBlockEditor({ block, onChange }: ParagraphBlockEditorProps) {
  const textId = useId();

  return (
    <div>
      <BlockFieldLabel htmlFor={textId}>Nội dung đoạn văn</BlockFieldLabel>
      <textarea
        id={textId}
        rows={3}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Nhập nội dung đoạn văn..."
        className="admin-input resize-y"
      />
    </div>
  );
}
