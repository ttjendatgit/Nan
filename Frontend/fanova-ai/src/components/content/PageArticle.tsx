import type { ContentBlock } from "@/types/contentBlocks";
import BlockRenderer from "@/components/admin/content/preview/BlockRenderer";

interface PageArticleProps {
  title: string;
  blocks: ContentBlock[];
  /** Public pages hide blocks with nothing to show; the Content Studio preview keeps their
   * "… trống" placeholders as an editing aid. */
  hideEmpty?: boolean;
}

/**
 * The presentation of a Page document's body -- its title plus BlockRenderer in the "nan" theme
 * (the homepage's light editorial look: EB Garamond headings in --nan-dark, Nan text/accent
 * tokens). Shared by the public /[slug] route and the Content Studio preview of Page documents so
 * the two can't drift apart. Renders no background of its own: the caller places it on the
 * --nan-light surface. Server-compatible (no hooks).
 */
export default function PageArticle({ title, blocks, hideEmpty = false }: PageArticleProps) {
  return (
    // @container: the title scales with the article's own width (a Tailwind container query), not
    // the viewport, so it's sized right both full-width on /[slug] and in the narrow preview column.
    // The 65ch reading column is set here, at the base font size, so the title's left edge lines
    // up with BlockRenderer's own max-w-[65ch] body (a max-w in "ch" on the h1 itself would be
    // measured in the h1's much larger font and come out wider).
    <article className="@container mx-auto w-full max-w-[65ch]">
      {title.trim() && (
        <h1
          className="mb-10 font-serif text-3xl font-semibold leading-[1.12] tracking-tight @xl:text-4xl @2xl:text-5xl"
          style={{ color: "var(--nan-dark)" }}
        >
          {title}
        </h1>
      )}
      <BlockRenderer blocks={blocks} hideEmpty={hideEmpty} theme="nan" />
    </article>
  );
}
