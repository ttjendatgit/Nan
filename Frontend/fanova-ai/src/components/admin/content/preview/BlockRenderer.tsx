"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ImageIcon, Images, Info } from "lucide-react";
import type {
  CalloutBlock as CalloutBlockType,
  CalloutTone,
  ContentBlock,
  GalleryBlock as GalleryBlockType,
  HeadingLevel,
  ImageBlock as ImageBlockType,
  ListBlock as ListBlockType,
  ParagraphBlock as ParagraphBlockType,
} from "@/types/contentBlocks";
import RichTextRenderer from "@/components/content/RichTextRenderer";

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
      return <ParagraphBlockPreview block={block} />;
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
    case "list":
      return <ListBlockPreview block={block} />;
    case "gallery":
      return <GalleryBlockPreview block={block} />;
    case "callout":
      return <CalloutBlockPreview block={block} />;
  }
}

function ParagraphBlockPreview({ block }: { block: ParagraphBlockType }) {
  // RichTextRenderer resolves the string-vs-TipTapDocument branch (and every sanitization/safety
  // concern within each) -- this component only supplies the visual shell (spacing/alignment
  // classes, empty-state copy) that every other block preview here also owns for itself.
  return (
    <RichTextRenderer
      content={block.text}
      emptyLabel={<EmptyBlockNote label="Đoạn văn trống" />}
      className="text-base leading-relaxed [&_a]:text-[var(--admin-primary)] [&_a]:underline [&_a]:underline-offset-2"
      style={{ color: "var(--admin-text-muted)", textAlign: block.align ?? "left" }}
    />
  );
}

// Missing/"center" both render full width -- that's the exact behavior every image block had
// before alignment existed, so old data is visually unchanged. Only "left"/"right" narrow the
// image and push it to one side, and only from the sm breakpoint up (full width below that, so
// a narrow phone viewport never has to fit a fractional-width image).
const IMAGE_ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "w-full sm:mr-auto sm:max-w-[60%]",
  center: "w-full",
  right: "w-full sm:ml-auto sm:max-w-[60%]",
};

function ImageBlockPreview({ block }: { block: ImageBlockType }) {
  return (
    <figure className={`m-0 ${IMAGE_ALIGN_CLASS[block.align ?? "center"]}`}>
      <div
        className="relative aspect-video overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}
      >
        {/* Keyed by url, not an effect -- a URL edit deserves a fresh attempt (otherwise fixing a
            broken link would stay stuck on the fallback forever), and the key is what gets React
            to discard the old ImageWithFallback instance and mount a new one when the url changes,
            which resets its `errored` state to false for free. */}
        <ImageWithFallback key={block.url} url={block.url} alt={block.alt} />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-center text-xs" style={{ color: "var(--admin-text-subtle)" }}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImageWithFallback({ url, alt }: { url: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const showImage = url.trim().length > 0 && !errored;

  if (showImage) {
    return (
      // Raw <img>, not next/image: the URL is free-text from ImageBlockEditor, not a configured
      // remote pattern -- upload/Cloudinary integration is a later phase.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} onError={() => setErrored(true)} className="h-full w-full object-cover" />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
      <ImageIcon className="h-6 w-6" style={{ color: "var(--admin-text-subtle)" }} aria-hidden="true" />
      <span className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>
        {url.trim() ? "Không thể tải hình ảnh" : "Chưa có hình ảnh"}
      </span>
    </div>
  );
}

function ListBlockPreview({ block }: { block: ListBlockType }) {
  // Blank rows are a normal mid-edit state in the editor (an admin just clicked "Thêm mục" and
  // hasn't typed yet) -- filtered out here so the preview reads as the finished article, not a
  // literal mirror of every in-progress keystroke.
  const items = block.items.map((item) => item.trim()).filter(Boolean);

  if (items.length === 0) {
    return (
      <p className="text-base leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
        <EmptyBlockNote label="Danh sách trống" />
      </p>
    );
  }

  const Tag = block.style === "ordered" ? "ol" : "ul";
  return (
    <Tag
      className={`ml-5 flex flex-col gap-1.5 text-base leading-relaxed ${block.style === "ordered" ? "list-decimal" : "list-disc"}`}
      style={{ color: "var(--admin-text-muted)" }}
    >
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </Tag>
  );
}

function GalleryBlockPreview({ block }: { block: GalleryBlockType }) {
  if (block.images.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1.5 rounded-lg px-4 py-8 text-center"
        style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}
      >
        <Images className="h-6 w-6" style={{ color: "var(--admin-text-subtle)" }} aria-hidden="true" />
        <span className="text-[11px]" style={{ color: "var(--admin-text-subtle)" }}>Chưa có hình ảnh trong bộ sưu tập</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {block.images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="aspect-square overflow-hidden rounded-lg" style={{ border: "1px solid var(--admin-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

const CALLOUT_TONE_CONFIG: Record<CalloutTone, { icon: typeof Info; color: string; soft: string; border: string }> = {
  info: { icon: Info, color: "var(--admin-info)", soft: "var(--admin-info-soft)", border: "rgba(8,51,125,0.22)" },
  success: { icon: CheckCircle2, color: "var(--admin-success)", soft: "var(--admin-success-soft)", border: "rgba(21,128,61,0.22)" },
  warning: { icon: AlertTriangle, color: "var(--admin-warning)", soft: "var(--admin-warning-soft)", border: "rgba(180,83,9,0.22)" },
};

function CalloutBlockPreview({ block }: { block: CalloutBlockType }) {
  const { icon: Icon, color, soft, border } = CALLOUT_TONE_CONFIG[block.tone];
  const isEmpty = !block.title.trim() && !block.text.trim();

  return (
    <div className="flex items-start gap-3 rounded-lg p-4" style={{ background: soft, border: `1px solid ${border}` }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
      <div className="flex-1">
        {isEmpty ? (
          <EmptyBlockNote label="Hộp ghi chú trống" />
        ) : (
          <>
            {block.title.trim() && <p className="font-semibold" style={{ color }}>{block.title}</p>}
            {block.text.trim() && (
              <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>{block.text}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyBlockNote({ label }: { label: string }) {
  return <span style={{ color: "var(--admin-text-subtle)" }}>{label}</span>;
}
