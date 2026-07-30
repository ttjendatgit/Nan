import Image from "next/image";
import { Quote as QuoteIcon } from "lucide-react";
import type {
  BlockAlign,
  BlockTone,
  ContentBlock,
  ListTone,
  ParagraphSize,
  ParagraphWeight,
  QuoteTone,
} from "@/types/catalog";

interface ContentBlocksRendererProps {
  blocks?: ContentBlock[];
  className?: string;
}

// ─── Safe style -> Tailwind class mapping ────────────────────────────────────
// Every function below is a closed switch over a known union type. No
// user-provided string is ever concatenated directly into a className.

function alignClass(align?: BlockAlign): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

function headingToneClass(tone?: BlockTone): string {
  switch (tone) {
    case "muted":
      return "text-[#B6D6F2]/70";
    case "accent":
      return "text-[#9FCBFF]";
    case "gold":
      return "text-[#E8C77A]";
    default:
      return "text-white";
  }
}

function paragraphToneClass(tone?: BlockTone): string {
  switch (tone) {
    case "muted":
      return "text-[#B6D6F2]/35";
    case "accent":
      return "text-[#9FCBFF]/90";
    case "gold":
      return "text-[#E8C77A]/90";
    default:
      return "text-[#B6D6F2]/55";
  }
}

function weightClass(weight?: ParagraphWeight): string {
  switch (weight) {
    case "medium":
      return "font-medium";
    case "semibold":
      return "font-semibold";
    case "bold":
      return "font-bold";
    default:
      return "font-normal";
  }
}

function sizeClass(size?: ParagraphSize): string {
  switch (size) {
    case "sm":
      return "text-xs";
    case "lg":
      return "text-base md:text-lg";
    default:
      return "text-sm";
  }
}

function listMarkerClass(tone?: ListTone): string {
  switch (tone) {
    case "accent":
      return "marker:text-[#9FCBFF]";
    default:
      return "marker:text-[#273481]";
  }
}

function quoteCardClass(tone?: QuoteTone): string {
  switch (tone) {
    case "accent":
      return "border-[#273481]/60 bg-[#111335]/70 shadow-[0_0_48px_-16px_rgba(159,203,255,0.28)]";
    case "gold":
      return "border-[#E8C77A]/30 bg-[#111335]/70 shadow-[0_0_48px_-16px_rgba(232,199,122,0.28)]";
    default:
      return "border-[#1B1C4A] bg-[#111335]/60 shadow-[0_0_40px_-16px_rgba(39,52,129,0.35)]";
  }
}

function quoteIconToneClass(tone?: QuoteTone): string {
  switch (tone) {
    case "accent":
      return "text-[#9FCBFF]/70";
    case "gold":
      return "text-[#E8C77A]/70";
    default:
      return "text-[#B6D6F2]/40";
  }
}

/**
 * Server-component-safe renderer for product content blocks.
 * No "use client", no hooks -- safe to use in both RSC and client components.
 *
 * Renders heading, paragraph, image, list, quote, and divider blocks using
 * the Nan dark premium design system. Unknown block types are silently
 * ignored. Blank headings/paragraphs/quotes, images without a secureUrl,
 * and lists with no valid items are skipped. All styling comes from closed
 * lookup tables over known enum values -- never raw HTML or arbitrary class
 * concatenation.
 */
export default function ContentBlocksRenderer({
  blocks,
  className,
}: ContentBlocksRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const text = block.text?.trim();
            if (!text) return null;
            const classes = `${headingToneClass(block.tone)} ${alignClass(block.align)} ${
              block.italic ? "italic" : ""
            }`;
            return block.level === 3 ? (
              <h3
                key={index}
                className={`text-lg md:text-xl font-medium tracking-tight leading-snug ${classes}`}
              >
                {text}
              </h3>
            ) : (
              <h2
                key={index}
                className={`text-2xl md:text-3xl font-semibold tracking-tight leading-tight ${classes}`}
              >
                {text}
              </h2>
            );
          }

          case "paragraph": {
            const text = block.text?.trim();
            if (!text) return null;
            return (
              <p
                key={index}
                className={`leading-relaxed ${sizeClass(block.size)} ${weightClass(
                  block.weight
                )} ${paragraphToneClass(block.tone)} ${alignClass(block.align)} ${
                  block.italic ? "italic" : ""
                }`}
              >
                {text}
              </p>
            );
          }

          case "image": {
            const src = block.secureUrl?.trim();
            if (!src) return null;
            const altText =
              block.alt?.trim() ||
              block.caption?.trim() ||
              "Product content image";
            return (
              <figure key={index}>
                <div className="rounded-2xl overflow-hidden border border-[#1B1C4A] bg-[#0A0B24]">
                  <Image
                    src={src}
                    alt={altText}
                    width={800}
                    height={450}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                {block.caption?.trim() && (
                  <figcaption className="text-xs text-[#B6D6F2]/35 mt-2 text-center">
                    {block.caption.trim()}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "list": {
            const items = (block.items ?? [])
              .map((item) => item?.trim())
              .filter((item): item is string => !!item);
            if (items.length === 0) return null;
            const markerCls = listMarkerClass(block.tone);
            const itemCls = "text-sm text-[#B6D6F2]/70 leading-relaxed pl-1";
            return block.style === "number" ? (
              <ol
                key={index}
                className={`list-decimal pl-5 space-y-2 marker:font-medium ${markerCls}`}
              >
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className={itemCls}>
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <ul
                key={index}
                className={`list-disc pl-5 space-y-2 marker:font-medium ${markerCls}`}
              >
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className={itemCls}>
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          case "quote": {
            const text = block.text?.trim();
            if (!text) return null;
            const caption = block.caption?.trim();
            return (
              <blockquote
                key={index}
                className={`relative rounded-2xl border p-6 md:p-7 ${quoteCardClass(
                  block.tone
                )}`}
              >
                <QuoteIcon
                  className={`h-5 w-5 mb-3 ${quoteIconToneClass(block.tone)}`}
                  aria-hidden="true"
                />
                <p className="text-base md:text-lg italic leading-relaxed text-white/90">
                  {text}
                </p>
                {caption && (
                  <footer className="mt-3 text-xs text-[#B6D6F2]/40">
                    — {caption}
                  </footer>
                )}
              </blockquote>
            );
          }

          case "divider": {
            return (
              <div
                key={index}
                className="h-px w-full bg-gradient-to-r from-transparent via-[#273481]/60 to-transparent"
                role="separator"
              />
            );
          }

          default:
            // Unknown block type -- skip silently for forward compatibility
            return null;
        }
      })}
    </div>
  );
}
