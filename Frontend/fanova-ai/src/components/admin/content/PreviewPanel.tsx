import { Eye } from "lucide-react";
import type { ContentBlock } from "@/types/contentBlocks";
import BlockRenderer from "./preview/BlockRenderer";

interface PreviewPanelProps {
  blocks: ContentBlock[];
}

export default function PreviewPanel({ blocks }: PreviewPanelProps) {
  return (
    <section
      aria-labelledby="preview-panel-heading"
      className="flex min-h-[360px] flex-col rounded-xl p-5"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
    >
      <h2 id="preview-panel-heading" className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
        Xem trước
      </h2>

      <div className="mt-3 flex-1">
        {blocks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center" style={{ borderColor: "var(--admin-border-strong)" }}>
            <Eye className="h-7 w-7" style={{ color: "var(--admin-primary)" }} strokeWidth={1.25} aria-hidden="true" />
            <p className="mt-3 text-xs leading-relaxed max-w-[32ch]" style={{ color: "var(--admin-text-subtle)" }}>
              Bản xem trước nội dung sẽ hiển thị ở đây.
            </p>
          </div>
        ) : (
          <BlockRenderer blocks={blocks} />
        )}
      </div>
    </section>
  );
}
