"use client";

import type { DividerBlock } from "@/types/contentBlocks";

interface DividerBlockEditorProps {
  block: DividerBlock;
  onChange: (block: DividerBlock) => void;
}

/** A divider has no editable fields -- this just previews what it will render as. */
export default function DividerBlockEditor(_props: DividerBlockEditorProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1" style={{ background: "var(--admin-border-strong)" }} aria-hidden="true" />
      <span className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>Đường kẻ phân cách</span>
      <div className="h-px flex-1" style={{ background: "var(--admin-border-strong)" }} aria-hidden="true" />
    </div>
  );
}
