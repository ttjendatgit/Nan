import Image from "next/image";
import type { ContentBlock } from "@/types/catalog";

interface ContentBlocksRendererProps {
  blocks?: ContentBlock[];
  className?: string;
}

/**
 * Server-component-safe renderer for product content blocks.
 * No "use client", no hooks -- safe to use in both RSC and client components.
 *
 * Renders heading (h2/h3), paragraph, and image blocks using the Nan dark
 * premium design system. Unknown block types are silently ignored.
 * Blank headings, empty paragraphs, and images without a secureUrl are skipped.
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
            return block.level === 3 ? (
              <h3
                key={index}
                className="text-base font-medium text-[#B6D6F2]"
              >
                {text}
              </h3>
            ) : (
              <h2
                key={index}
                className="text-xl font-semibold text-white"
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
                className="text-sm text-[#B6D6F2]/55 leading-relaxed max-w-[65ch]"
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

          default:
            // Unknown block type -- skip silently for forward compatibility
            return null;
        }
      })}
    </div>
  );
}
