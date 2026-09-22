"use client";

import { useId } from "react";
import type { QuoteBlock } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

interface QuoteBlockEditorProps {
  block: QuoteBlock;
  onChange: (block: QuoteBlock) => void;
}

export default function QuoteBlockEditor({ block, onChange }: QuoteBlockEditorProps) {
  const textId = useId();

  return (
    <div>
      <BlockFieldLabel htmlFor={textId}>Nội dung trích dẫn</BlockFieldLabel>
      <textarea
        id={textId}
        rows={2}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Nhập câu trích dẫn..."
        className="admin-input resize-y italic"
      />
    </div>
  );
}
