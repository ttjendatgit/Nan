/**
 * Sanitization for the constrained inline-HTML rich text subset ParagraphBlock.text can hold when
 * it's a plain string (bold, italic, link, line break) -- the legacy shape every paragraph saved
 * before Phase 2.3.1 is, and the shape Phase 2.1's now-removed contentEditable editor produced.
 * Deliberately narrow -- this is not a general-purpose HTML sanitizer, only this constrained
 * subset, plus safety against anything else (a direct API write, hand-edited legacy data) that
 * ends up in the same `text` field.
 *
 * Runs at two points, both load-bearing:
 *   1. contentBlocks.ts's coerceContentBlock, when a document is loaded from the API -- so a
 *      block entering the app's in-memory state is trusted-safe regardless of where its JSON
 *      came from.
 *   2. RichTextRenderer.tsx, immediately before dangerouslySetInnerHTML, for the string branch of
 *      ParagraphBlock.text -- never trusted from step 1 alone.
 *
 * A plain string with no tags at all (every ParagraphBlock saved before Phase 2.1) passes through
 * completely unchanged -- there is nothing to strip -- which is exactly what makes this backward
 * compatible.
 *
 * Phase 2.3.1 note: ParagraphBlock.text is now `string | TipTapDocument`. Everything in this file
 * still applies only to the string half of that union. The TipTap-JSON half (produced by the
 * current editor, RichTextInput.tsx) has its own equivalent trust boundary in lib/tiptapContent.ts
 * and components/content/RichTextRenderer.tsx; `isSafeHref` below is shared by both paths so link
 * safety is defined in exactly one place regardless of which representation a block is in.
 */

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "A", "BR"]);
const ALLOWED_ATTRS: Record<string, string[]> = { A: ["href"] };
const REMOVE_ENTIRELY = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "NOSCRIPT"]);

/** Exported so both the legacy sanitizer (below) and the TipTap path (RichTextInput's Link
 * extension config, RichTextRenderer's link-mark rendering) share exactly one definition of
 * "safe link protocol" -- http/https/mailto only -- rather than three copies drifting apart. */
export function isSafeHref(href: string): boolean {
  try {
    const url = new URL(href, "https://placeholder.invalid");
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function sanitizeElement(el: Element): void {
  if (REMOVE_ENTIRELY.has(el.tagName)) {
    el.remove();
    return;
  }

  // Bottom-up: clean children before deciding what to do with this element itself, so unwrapping
  // a disallowed wrapper keeps its already-sanitized content.
  Array.from(el.children).forEach(sanitizeElement);

  if (!ALLOWED_TAGS.has(el.tagName)) {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
    return;
  }

  const allowedAttrs = ALLOWED_ATTRS[el.tagName] ?? [];
  Array.from(el.attributes).forEach((attr) => {
    if (!allowedAttrs.includes(attr.name.toLowerCase())) el.removeAttribute(attr.name);
  });

  if (el.tagName === "A") {
    const href = el.getAttribute("href");
    if (!href || !isSafeHref(href)) {
      el.removeAttribute("href");
    } else {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  }
}

/** Strips everything down to <b>/<strong>/<i>/<em>/<a href>/<br>, keeping the text content of
 * anything else instead of deleting it (so a pasted Word doc loses its formatting, not its
 * words). Safe to call with plain text -- returns it byte-for-byte unchanged. */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    // No browser context (every real call site is client-only, so this shouldn't happen) --
    // fail safe by stripping all tags rather than risk passing through something unsafe.
    return html.replace(/<[^>]*>/g, "");
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  Array.from(container.children).forEach(sanitizeElement);
  return container.innerHTML;
}

/** True when the rich text has no visible content -- empty string, or only tags/whitespace (e.g.
 * a contentEditable left holding a lone stray <br>). */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return stripped.length === 0;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
