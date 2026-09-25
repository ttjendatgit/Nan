import { Eye } from "lucide-react";
import type { ContentBlock } from "@/types/contentBlocks";
import BlockRenderer from "./preview/BlockRenderer";
import PageArticle from "@/components/content/PageArticle";

interface PreviewPanelProps {
  blocks: ContentBlock[];
  /** Page documents are previewed exactly as the public /[slug] page renders them (PageArticle on
   * the --nan-light surface); every other type keeps the original admin-themed preview. */
  documentType?: string;
  title?: string;
}

export default function PreviewPanel({ blocks, documentType, title = "" }: PreviewPanelProps) {
  const isPage = documentType === "Page";
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
        ) : isPage ? (
          <div className="rounded-lg px-5 py-8" style={{ background: "var(--nan-light)" }}>
            <PageArticle title={title} blocks={blocks} />
          </div>
        ) : (
          <BlockRenderer blocks={blocks} />
        )}
      </div>
    </section>
  );
}
