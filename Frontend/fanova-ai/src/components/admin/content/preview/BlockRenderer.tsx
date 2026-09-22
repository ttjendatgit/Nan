"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import type { ContentBlock, HeadingLevel, ImageBlock as ImageBlockType } from "@/types/contentBlocks";

interface BlockRendererProps {
  blocks: ContentBlock[];
}

const HEADING_CLS: Record<HeadingLevel, string> = {
  h1: "text-3xl leading-tight tracking-tight",
  h2: "text-2xl leading-tight tracking-tight",
  h3: "text-lg leading-snug",
};

/**
 * Renders the exact same ContentBlock[] schema BlockEditor produces -- read-only, no editing
 * affordances. Wrapped in a "content-preview" reading column (capped line length, generous block
 * spacing, real typography hierarchy) so it reads like an actual content page instead of a loose
 * stack of admin-panel text. Still an in-workspace preview, not the production public-facing
 * renderer -- that, plus SEO and publishing, belongs to a later phase.
 */
export default function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="content-preview mx-auto flex max-w-[65ch] flex-col gap-6">
      {blocks.map((block) => <BlockPreview key={block.id} block={block} />)}
    </div>
  );
}

/** Exhaustive switch, no `default`: a new ContentBlockType without a case here is a compile error. */
function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level;
      return (
        <Tag className={`${HEADING_CLS[block.level]} font-semibold`} style={{ color: "var(--admin-text)" }}>
          {block.text || <EmptyBlockNote label="Tiêu đề trống" />}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className="text-base leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
          {block.text || <EmptyBlockNote label="Đoạn văn trống" />}
        </p>
      );
    case "quote":
      return (
        <blockquote
          className="rounded-r-lg py-3 pr-4 pl-4 text-base italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--admin-accent)", background: "var(--admin-accent-soft)", color: "var(--admin-text-muted)" }}
        >
          {block.text || <EmptyBlockNote label="Trích dẫn trống" />}
        </blockquote>
      );
    case "divider":
      return <hr className="my-1" style={{ border: "none", borderTop: "1px solid var(--admin-border)" }} />;
    case "image":
      return <ImageBlockPreview block={block} />;
  }
}

function ImageBlockPreview({ block }: { block: ImageBlockType }) {
  const [errored, setErrored] = useState(false);

  // A URL edit deserves a fresh attempt -- otherwise fixing a broken link would stay stuck on
  // the fallback forever, since React doesn't reset state just because a prop changed.
  useEffect(() => {
    setErrored(false);
  }, [block.url]);

  const showImage = block.url.trim().length > 0 && !errored;

  return (
    <figure className="m-0">
      <div
        className="relative aspect-video overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}
      >
        {showImage ? (
          // Raw <img>, not next/image: the URL is free-text from ImageBlockEditor, not a
          // configured remote pattern -- upload/Cloudinary integration is a later phase.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.url}
            alt={block.alt}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
            <ImageIcon className="h-6 w-6" style={{ color: "var(--admin-text-subtle)" }} aria-hidden="true" />
            <span className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
              {block.url.trim() ? "Không thể tải hình ảnh" : "Chưa có hình ảnh"}
            </span>
          </div>
        )}
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-center text-xs" style={{ color: "var(--admin-text-subtle)" }}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function EmptyBlockNote({ label }: { label: string }) {
  return <span style={{ color: "var(--admin-text-subtle)" }}>{label}</span>;
}
