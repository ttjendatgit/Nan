"use client";

import { useId } from "react";
import type { BlockAlign, ParagraphBlock } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";
import RichTextInput from "../RichTextInput";

const ALIGN_OPTIONS: BlockAlign[] = ["left", "center", "right"];
const ALIGN_LABELS: Record<BlockAlign, string> = {
  left: "Trái",
  center: "Giữa",
  right: "Phải",
};

interface ParagraphBlockEditorProps {
  block: ParagraphBlock;
  onChange: (block: ParagraphBlock) => void;
}

export default function ParagraphBlockEditor({ block, onChange }: ParagraphBlockEditorProps) {
  const alignId = useId();
  const textId = useId();

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <div className="sm:w-40 sm:shrink-0">
        <BlockFieldLabel htmlFor={alignId}>Căn lề</BlockFieldLabel>
        <select
          id={alignId}
          value={block.align ?? "left"}
          onChange={(e) => onChange({ ...block, align: e.target.value as BlockAlign })}
          className="admin-input"
        >
          {ALIGN_OPTIONS.map((align) => <option key={align} value={align}>{ALIGN_LABELS[align]}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <BlockFieldLabel htmlFor={textId}>Nội dung đoạn văn</BlockFieldLabel>
        <RichTextInput
          id={textId}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Nhập nội dung đoạn văn..."
          align={block.align ?? "left"}
        />
      </div>
    </div>
  );
}
