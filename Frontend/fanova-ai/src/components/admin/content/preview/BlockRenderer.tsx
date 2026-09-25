import type { CSSProperties } from "react";
import { AlertTriangle, CheckCircle2, Images, Info } from "lucide-react";
import type {
  CalloutBlock as CalloutBlockType,
  CalloutTone,
  ContentBlock,
  GalleryBlock as GalleryBlockType,
  HeadingLevel,
  ImageBlock as ImageBlockType,
  ImageSize,
  ListBlock as ListBlockType,
  ParagraphBlock as ParagraphBlockType,
} from "@/types/contentBlocks";
import RichTextRenderer from "@/components/content/RichTextRenderer";
import { isRichTextEmpty } from "@/lib/richText";
import { isTipTapDocEmpty, isTipTapDocument } from "@/lib/tiptapContent";
import ImageWithFallback from "./ImageWithFallback";

interface BlockRendererProps {
  blocks: ContentBlock[];
  /** Public pages (Content Studio B2): leave out blocks with nothing to show instead of rendering
   * their "… trống" placeholder -- the placeholders are an editing aid for the admin preview. */
  hideEmpty?: boolean;
  /** Color/typography theme -- see CONTENT_THEME_VARS. "admin" (default) is the original preview
   * look; "nan" is the homepage's light editorial look used for Page documents, on the public
   * /[slug] pages and in their Content Studio preview. Only the --content-* values and the heading
   * font differ between themes -- the markup and layout rules are the same. */
  theme?: ContentTheme;
}

type ContentTheme = "admin" | "nan";

/**
 * Every color below goes through these --content-* custom properties. They're set inline on the
 * renderer's own root element (not in globals.css), so a block's color can never depend on a
 * global stylesheet being present/up to date -- if a --content-* value were missing, var() would
 * fall back to whatever color the page around the renderer happens to have (on /[slug] that was
 * the dark shell's white). "admin" keeps the Content Studio preview of ProductContent/BlogPost
 * exactly as before; "nan" mirrors the homepage's light sections (FAQSection/ProblemSection):
 * --nan-dark text, 0.72 body copy, --nan-blue links, --nan-material accents.
 */
const CONTENT_THEME_VARS: Record<ContentTheme, CSSProperties> = {
  admin: {
    "--content-text": "var(--admin-text)",
    "--content-text-muted": "var(--admin-text-muted)",
    "--content-text-subtle": "var(--admin-text-subtle)",
    "--content-primary": "var(--admin-primary)",
    "--content-border": "var(--admin-border)",
    "--content-surface-muted": "var(--admin-surface-muted)",
    "--content-accent": "var(--admin-accent)",
    "--content-accent-soft": "var(--admin-accent-soft)",
  } as CSSProperties,
  nan: {
    "--content-text": "var(--nan-dark)",
    "--content-text-muted": "rgba(15, 19, 32, 0.72)",
    "--content-text-subtle": "rgba(15, 19, 32, 0.5)",
    "--content-primary": "var(--nan-blue)",
    "--content-border": "rgba(15, 19, 32, 0.14)",
    "--content-surface-muted": "rgba(15, 19, 32, 0.04)",
    "--content-accent": "var(--nan-material)",
    "--content-accent-soft": "rgba(182, 161, 123, 0.14)",
  } as CSSProperties,
};

const HEADING_CLS: Record<HeadingLevel, string> = {
  h1: "text-3xl leading-tight tracking-tight",
  h2: "text-2xl leading-tight tracking-tight",
  h3: "text-lg leading-snug",
};

/**
 * Renders the exact same ContentBlock[] schema BlockEditor produces -- read-only, no editing
 * affordances. Wrapped in a "content-preview" reading column (capped line length, generous block
 * spacing, real typography hierarchy) so it reads like an actual content page instead of a loose
 * stack of admin-panel text.
 *
 * Content Studio B2: also the public renderer for /[slug] -- one set of presentation rules for
 * both the admin preview and the published page. Server-compatible (no hooks here; the one
 * interactive piece, ImageWithFallback, is its own client component), so a public page's text is
 * in the server-rendered HTML.
 */
export default function BlockRenderer({ blocks, hideEmpty = false, theme = "admin" }: BlockRendererProps) {
  const visible = hideEmpty ? blocks.filter((block) => !isBlockEmpty(block)) : blocks;
  return (
    <div className="content-preview mx-auto flex max-w-[65ch] flex-col gap-6" style={CONTENT_THEME_VARS[theme]}>
      {visible.map((block) => <BlockPreview key={block.id} block={block} theme={theme} />)}
    </div>
  );
}

/** True when a block would only render its "… trống" placeholder below. Exhaustive like
 * BlockPreview. */
function isBlockEmpty(block: ContentBlock): boolean {
  switch (block.type) {
    case "heading":
    case "quote":
      return !block.text.trim();
    case "paragraph":
      return typeof block.text === "string"
        ? isRichTextEmpty(block.text)
        : !isTipTapDocument(block.text) || isTipTapDocEmpty(block.text);
    case "divider":
      return false;
    case "image":
      return !block.url.trim();
    case "list":
      return block.items.every((item) => !item.trim());
    case "gallery":
      return block.images.length === 0;
    case "callout":
      return !block.title.trim() && !block.text.trim();
  }
}

/** Exhaustive switch, no `default`: a new ContentBlockType without a case here is a compile error. */
function BlockPreview({ block, theme }: { block: ContentBlock; theme: ContentTheme }) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level;
      // "nan": EB Garamond headings, like the homepage's light sections.
      return (
        <Tag className={`${HEADING_CLS[block.level]} font-semibold${theme === "nan" ? " font-serif" : ""}`} style={{ color: "var(--content-text)" }}>
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
          style={{ borderLeft: "3px solid var(--content-accent)", background: "var(--content-accent-soft)", color: "var(--content-text-muted)" }}
        >
          {block.text || <EmptyBlockNote label="Trích dẫn trống" />}
        </blockquote>
      );
    case "divider":
      return <hr className="my-1" style={{ border: "none", borderTop: "1px solid var(--content-border)" }} />;
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
      className="text-base leading-relaxed [&_a]:text-[var(--content-primary)] [&_a]:underline [&_a]:underline-offset-2"
      style={{ color: "var(--content-text-muted)", textAlign: block.align ?? "left" }}
    />
  );
}

function ImageBlockPreview({ block }: { block: ImageBlockType }) {
  // Blocks saved before `size` existed keep their original rendering, untouched.
  if (!block.size) return <LegacyImageBlockPreview block={block} />;

  const width = IMAGE_SIZE_WIDTH[block.size];
  const align = block.align ?? "center";
  return (
    // Width is a percentage of the content column (this figure's containing block is
    // BlockRenderer's max-w-[65ch] column, in both the preview and /[slug]), so the same block
    // keeps the same proportion in the narrow preview pane and on the public page. "original"
    // uses fit-content: the image's natural width, never wider than the column (max-w-full).
    // margin-left/right auto position the whole figure -- caption included.
    <figure
      className="m-0 max-w-full"
      style={{
        width: width ?? "fit-content",
        marginLeft: align === "left" ? 0 : "auto",
        marginRight: align === "right" ? 0 : "auto",
      }}
    >
      <div
        className="overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--content-border)", background: "var(--content-surface-muted)" }}
      >
        {/* Keyed by url: see LegacyImageBlockPreview. */}
        <ImageWithFallback key={block.url} url={block.url} alt={block.alt} fit="natural" fill={width !== undefined} />
      </div>
      {block.caption && (
        // contain: inline-size -- a long caption wraps to the figure's width instead of widening
        // an "original"-size figure beyond its image.
        <figcaption className="mt-2 text-center text-xs" style={{ color: "var(--content-text-subtle)", contain: "inline-size" }}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Share of the content column per ImageBlock.size; undefined = natural width ("original"). */
const IMAGE_SIZE_WIDTH: Record<ImageSize, string | undefined> = {
  original: undefined,
  small: "25%",
  medium: "50%",
  large: "75%",
  full: "100%",
};

// Rendering for image blocks without `size` (everything saved before that field existed) --
// unchanged. Missing/"center" both render full width -- that's the exact behavior every image
// block had before alignment existed, so old data is visually unchanged. Only "left"/"right"
// narrow the image and push it to one side, and only from the sm breakpoint up (full width below
// that, so a narrow phone viewport never has to fit a fractional-width image).
const IMAGE_ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "w-full sm:mr-auto sm:max-w-[60%]",
  center: "w-full",
  right: "w-full sm:ml-auto sm:max-w-[60%]",
};

function LegacyImageBlockPreview({ block }: { block: ImageBlockType }) {
  return (
    <figure className={`m-0 ${IMAGE_ALIGN_CLASS[block.align ?? "center"]}`}>
      <div
        className="relative aspect-video overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--content-border)", background: "var(--content-surface-muted)" }}
      >
        {/* Keyed by url, not an effect -- a URL edit deserves a fresh attempt (otherwise fixing a
            broken link would stay stuck on the fallback forever), and the key is what gets React
            to discard the old ImageWithFallback instance and mount a new one when the url changes,
            which resets its `errored` state to false for free. */}
        <ImageWithFallback key={block.url} url={block.url} alt={block.alt} />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-center text-xs" style={{ color: "var(--content-text-subtle)" }}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ListBlockPreview({ block }: { block: ListBlockType }) {
  // Blank rows are a normal mid-edit state in the editor (an admin just clicked "Thêm mục" and
  // hasn't typed yet) -- filtered out here so the preview reads as the finished article, not a
  // literal mirror of every in-progress keystroke.
  const items = block.items.map((item) => item.trim()).filter(Boolean);

  if (items.length === 0) {
    return (
      <p className="text-base leading-relaxed" style={{ color: "var(--content-text-muted)" }}>
        <EmptyBlockNote label="Danh sách trống" />
      </p>
    );
  }

  const Tag = block.style === "ordered" ? "ol" : "ul";
  return (
    <Tag
      className={`ml-5 flex flex-col gap-1.5 text-base leading-relaxed ${block.style === "ordered" ? "list-decimal" : "list-disc"}`}
      style={{ color: "var(--content-text-muted)" }}
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
        style={{ border: "1px solid var(--content-border)", background: "var(--content-surface-muted)" }}
      >
        <Images className="h-6 w-6" style={{ color: "var(--content-text-subtle)" }} aria-hidden="true" />
        <span className="text-[11px]" style={{ color: "var(--content-text-subtle)" }}>Chưa có hình ảnh trong bộ sưu tập</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {block.images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="aspect-square overflow-hidden rounded-lg" style={{ border: "1px solid var(--content-border)" }}>
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
              <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--content-text-muted)" }}>{block.text}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyBlockNote({ label }: { label: string }) {
  return <span style={{ color: "var(--content-text-subtle)" }}>{label}</span>;
}
