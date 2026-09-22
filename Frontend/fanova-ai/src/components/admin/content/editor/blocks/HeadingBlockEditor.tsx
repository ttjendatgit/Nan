"use client";

import { useId } from "react";
import type { HeadingBlock, HeadingLevel } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

const LEVELS: HeadingLevel[] = ["h1", "h2", "h3"];
const LEVEL_LABELS: Record<HeadingLevel, string> = {
  h1: "Tiêu đề lớn (H1)",
  h2: "Tiêu đề vừa (H2)",
  h3: "Tiêu đề nhỏ (H3)",
};

interface HeadingBlockEditorProps {
  block: HeadingBlock;
  onChange: (block: HeadingBlock) => void;
}

export default function HeadingBlockEditor({ block, onChange }: HeadingBlockEditorProps) {
  const levelId = useId();
  const textId = useId();

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <div className="sm:w-40 sm:shrink-0">
        <BlockFieldLabel htmlFor={levelId}>Cấp độ</BlockFieldLabel>
        <select
          id={levelId}
          value={block.level}
          onChange={(e) => onChange({ ...block, level: e.target.value as HeadingLevel })}
          className="admin-input"
        >
          {LEVELS.map((level) => <option key={level} value={level}>{LEVEL_LABELS[level]}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <BlockFieldLabel htmlFor={textId}>Nội dung tiêu đề</BlockFieldLabel>
        <input
          id={textId}
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Nhập tiêu đề..."
          className="admin-input font-medium"
        />
      </div>
    </div>
  );
}
