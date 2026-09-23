import type { ReactNode } from "react";
import { Fragment } from "react";
import type { JSONContent } from "@tiptap/core";
import { isRichTextEmpty, isSafeHref, sanitizeRichText } from "@/lib/richText";
import { isTipTapDocEmpty, isTipTapDocument, type TipTapDocument } from "@/lib/tiptapContent";

interface RichTextRendererProps {
  /** ParagraphBlock.text as stored -- either shape is valid input, this component is exactly
   * where the branch between them is resolved so no other component needs to know both exist. */
  content: string | TipTapDocument | null | undefined;
  /** Rendered in place of the content when there's nothing to show (mirrors how every other
   * block preview in BlockRenderer.tsx shows an EmptyBlockNote). Omit to render nothing at all. */
  emptyLabel?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders ParagraphBlock.text -- legacy plain text / constrained HTML string, or Phase 2.3.1's
 * TipTap JSON -- as read-only React output. Used by both BlockRenderer.tsx's in-workspace preview
 * and (later) any public-facing renderer, which is why it lives outside admin/ under
 * components/content rather than components/admin/content.
 *
 * Never throws. Every branch below -- a non-string/non-doc value, a doc missing `content`, a node
 * with an unrecognized type, a mark this editor doesn't produce, a link with an unsafe href --
 * degrades to something reasonable (usually: render the plain text anyway, or render nothing)
 * instead of crashing, so one malformed paragraph can never take down the rest of the page.
 */
export default function RichTextRenderer({ content, emptyLabel, className, style }: RichTextRendererProps) {
  // Legacy path: unchanged from Phase 2.1/2.2. sanitizeRichText runs here too, not just at parse
  // time -- dangerouslySetInnerHTML must never render anything without its own independent check
  // immediately before use.
  if (typeof content === "string") {
    if (isRichTextEmpty(content)) return renderEmpty(emptyLabel, className, style);
    return <p className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }} />;
  }

  if (!content || !isTipTapDocument(content) || isTipTapDocEmpty(content)) {
    return renderEmpty(emptyLabel, className, style);
  }

  const paragraphNodes = (content.content ?? []).filter(
    (node): node is JSONContent => !!node && typeof node === "object" && node.type === "paragraph",
  );
  if (paragraphNodes.length === 0) return renderEmpty(emptyLabel, className, style);

  if (paragraphNodes.length === 1) {
    return <p className={className} style={style}>{renderInline(paragraphNodes[0].content)}</p>;
  }

  // A multi-paragraph HTML paste is the one way this doc can end up with more than one top-level
  // paragraph node (see RichTextInput.tsx) -- rendered as its own stack of <p>s rather than
  // forced into one, so that content is never silently lost.
  return (
    <div className="flex flex-col gap-3">
      {paragraphNodes.map((node, i) => <p key={i} className={className} style={style}>{renderInline(node.content)}</p>)}
    </div>
  );
}

function renderEmpty(emptyLabel: ReactNode, className: string | undefined, style: React.CSSProperties | undefined) {
  if (emptyLabel == null) return null;
  return <p className={className} style={style}>{emptyLabel}</p>;
}

function renderInline(nodes: JSONContent[] | undefined): ReactNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node, i) => renderInlineNode(node, i));
}

function renderInlineNode(node: JSONContent, key: number): ReactNode {
  if (!node || typeof node !== "object") return null;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "text") return renderTextNode(node, key);
  // Unrecognized inline node type (a future TipTap version, hand-edited JSON) -- if it has its
  // own content, render that rather than dropping the words inside it silently.
  if (Array.isArray(node.content)) return <Fragment key={key}>{renderInline(node.content)}</Fragment>;
  return null;
}

function renderTextNode(node: JSONContent, key: number): ReactNode {
  const text: ReactNode = typeof node.text === "string" ? node.text : "";
  const marked = (node.marks ?? []).reduce<ReactNode>((child, mark) => applyMark(mark, child), text);
  return <Fragment key={key}>{marked}</Fragment>;
}

function applyMark(mark: { type: string; attrs?: Record<string, unknown> }, child: ReactNode): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong>{child}</strong>;
    case "italic":
      return <em>{child}</em>;
    case "highlight":
      // Fixed color only (multicolor is off in RichTextInput's Highlight config) -- this never
      // reads a color/attrs value from the mark, so a hand-edited JSON couldn't smuggle an
      // arbitrary color in even if it tried.
      return <mark className="cs-highlight">{child}</mark>;
    case "link": {
      const href = mark.attrs?.href;
      // Re-validated here independently of whatever RichTextInput's Link extension already
      // enforced at edit time -- the same "never trust an earlier layer alone" rule
      // sanitizeRichText already follows for the legacy path. An unsafe/missing href renders the
      // text without a link rather than as a dead or dangerous one.
      if (typeof href !== "string" || !isSafeHref(href)) return child;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--admin-primary)] underline underline-offset-2">
          {child}
        </a>
      );
    }
    default:
      // Unrecognized mark -- render the text without it rather than dropping the text itself.
      return child;
  }
}
