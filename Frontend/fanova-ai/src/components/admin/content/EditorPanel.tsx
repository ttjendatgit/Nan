"use client";

import type { ContentBlock, ContentBlockType } from "@/types/contentBlocks";
import type { TipTapDocument } from "@/lib/tiptapContent";
import type { ParagraphBackspacePayload, ParagraphEnterPayload } from "./editor/RichTextInput";
import BlockEditor from "./editor/BlockEditor";

interface EditorPanelProps {
  blocks: ContentBlock[];
  onAddBlock: (type: ContentBlockType) => ContentBlock;
  onUpdateBlock: (block: ContentBlock) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: -1 | 1) => void;
  token: string;
  pendingFocus: { blockId: string; position: "start" | "end" } | null;
  requestFocus: (blockId: string | null, position?: "start" | "end") => void;
  pendingMerge: { blockId: string; incoming: TipTapDocument } | null;
  clearMerge: () => void;
  onParagraphEnter: (blockId: string, index: number, payload: ParagraphEnterPayload) => void;
  onParagraphBackspace: (blockId: string, index: number, payload: ParagraphBackspacePayload) => void;
}

export default function EditorPanel({
  blocks, onAddBlock, onUpdateBlock, onRemoveBlock, onMoveBlock, token,
  pendingFocus, requestFocus, pendingMerge, clearMerge, onParagraphEnter, onParagraphBackspace,
}: EditorPanelProps) {
  return (
    <section
      aria-labelledby="editor-panel-heading"
      className="flex min-h-[360px] flex-col rounded-xl p-5"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
    >
      <h2 id="editor-panel-heading" className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
        Trình soạn thảo
      </h2>

      <div className="mt-3 flex-1">
        <BlockEditor
          blocks={blocks}
          onAddBlock={onAddBlock}
          onUpdateBlock={onUpdateBlock}
          onRemoveBlock={onRemoveBlock}
          onMoveBlock={onMoveBlock}
          token={token}
          pendingFocus={pendingFocus}
          requestFocus={requestFocus}
          pendingMerge={pendingMerge}
          clearMerge={clearMerge}
          onParagraphEnter={onParagraphEnter}
          onParagraphBackspace={onParagraphBackspace}
        />
      </div>
    </section>
  );
}
