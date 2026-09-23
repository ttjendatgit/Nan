"use client";

import type { DividerBlock } from "@/types/contentBlocks";

interface DividerBlockEditorProps {
  block: DividerBlock;
  onChange: (block: DividerBlock) => void;
}

/** A divider has no editable fields -- this just previews what it will render as. The empty
 * destructuring pattern keeps the DividerBlockEditorProps type contract (so BlockItem's dispatch
 * call site, which passes `block`/`onChange` the same way every other block editor's does, still
 * type-checks) while binding no local name at all for either field -- unlike a named-but-unused
 * parameter (`_props`), there's nothing here for no-unused-vars to flag. */
export default function DividerBlockEditor({}: DividerBlockEditorProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1" style={{ background: "var(--admin-border-strong)" }} aria-hidden="true" />
      <span className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>Đường kẻ phân cách</span>
      <div className="h-px flex-1" style={{ background: "var(--admin-border-strong)" }} aria-hidden="true" />
    </div>
  );
}
