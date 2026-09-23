/**
 * Converts clipboard content (HTML, or plain text/markdown) into ContentBlock[] -- the engine
 * behind Phase A3's "paste a long article and it splits into real blocks" behavior. A pure
 * function: the same html/text input always produces the same blocks (aside from freshly
 * generated block ids, which are inherently new every call, same as any of the createXBlock()
 * factories already are). Only ever called from RichTextInput.tsx's `handlePaste`, which is
 * itself only reachable from a live paste event in a mounted browser editor -- so the DOMParser
 * use throughout this file needs no server-side guard the way lib/richText.ts's sanitizeRichText
 * does (that one is also reachable during SSR, via parseBlocksJson at initial page render; this
 * one genuinely is not).
 *
 * Inline HTML -> TipTapDocument conversion reuses lib/richTextExtensions.ts's exact extension
 * array via TipTap's own `generateJSON`, rather than a second, hand-rolled inline-mark parser --
 * see that file's header comment for why sharing one configured array matters (schema-constrained
 * sanitization, and one single `isAllowedUri` link-protocol gate, in exactly one place).
 */

import { generateJSON } from "@tiptap/core";
import { marked } from "marked";
import {
  createDividerBlock,
  createHeadingBlock,
  createListBlock,
  createParagraphBlock,
  createQuoteBlock,
} from "@/types/contentBlocks";
import type { ContentBlock, HeadingLevel, ListStyle } from "@/types/contentBlocks";
import { richTextExtensions } from "@/lib/richTextExtensions";
import { isTipTapDocEmpty, type TipTapDocument } from "@/lib/tiptapContent";

const SKIP_TAGS = new Set(["STYLE", "META", "SCRIPT", "LINK", "TITLE", "HEAD", "NOSCRIPT"]);

// Structural wrapper tags: always descend into their children directly (never wrapped in a
// synthetic <p> for generateJSON -- these are block-level by nature, and nesting a block tag
// inside a synthetic <p> for parsing would be invalid content the parser's recovery behavior
// can't be relied on without a browser to verify against).
const WRAPPER_TAGS = new Set([
  "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE", "NAV", "FIGURE", "FIGCAPTION",
]);

// Only checked against an element's *direct* children -- enough to decide "does this wrapper
// contain real block structure, or just inline content" at each level; deeper levels are handled
// by the recursion itself.
const BLOCK_LEVEL_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "HR", "PRE", "TABLE",
  ...WRAPPER_TAGS,
]);

const WORD_BULLET_PREFIX = /^([•·▪]|o)\s+/;

// A3-fix, general rule (primary protection -- see walkChildren): any of these inline-formatting
// tags that structurally contains block-level content (checked via BLOCK_LEVEL_TAGS below) is
// treated as a transparent container, not as formatting. An inline tag was never meant to hold
// block content; whatever real-world export tool produced this (Google Docs' neutral-bold wrapper
// is the known example, but not the only possible one -- any markup change that used a different
// wrapping tag or a different id/style would defeat a signature-based check alone), the structural
// shape itself -- "an inline tag directly containing a block element" -- is what's detected here,
// not a specific tool's fingerprint.
const INLINE_MARK_TAGS = new Set(["B", "STRONG", "I", "EM", "SPAN", "FONT", "U", "A"]);

/**
 * The one exported entry point. Returns [] when there's nothing usable to convert (blank
 * clipboard, or content that reduces to nothing after cleanup -- an all-image paste, for
 * instance) -- callers treat an empty result as "let the default paste handling run instead."
 */
export function clipboardToBlocks(html: string | null, text: string | null): ContentBlock[] {
  const hasHtml = !!(html && html.trim());

  // A3-fix: a single line of plain text (no html) never goes through `marked` at all. Without
  // this, pasting "- 20% giảm giá" mid-sentence would get read as a one-item Markdown bullet list
  // (a leading "- ") and turn into a new ListBlock instead of just inserting the text at the
  // cursor. Checked against the text with a trailing newline stripped first, since a single line
  // copied from many apps still arrives with exactly one trailing "\n" -- that alone shouldn't be
  // enough to route it through the multi-block markdown pipeline.
  if (!hasHtml && text) {
    const withoutTrailingNewline = text.replace(/[\r\n]+$/, "");
    if (!withoutTrailingNewline.includes("\n")) {
      const trimmed = withoutTrailingNewline.trim();
      // Returning exactly one plain ParagraphBlock (not [] for a non-empty single line) is what
      // makes RichTextInput.tsx's "exactly one plain paragraph -> return false" rule apply, so
      // this falls through to the default paste behavior untouched.
      return trimmed ? [{ ...createParagraphBlock(), text: trimmed }] : [];
    }
  }

  const sourceHtml = hasHtml ? (html as string) : text && text.trim() ? markdownToHtml(text) : null;
  if (!sourceHtml) return [];

  if (typeof DOMParser === "undefined") return []; // defensive only -- see header comment on why this shouldn't be reachable

  const parsed = new DOMParser().parseFromString(sourceHtml, "text/html");
  normalizeDocument(parsed.body);

  const blocks: ContentBlock[] = [];
  walkChildren(parsed.body, blocks);

  return collapseWordBulletParagraphs(blocks);
}

/** ChatGPT's "Copy" button, a .md file, Notepad -- anything that only offers text/plain. Routed
 * through the exact same HTML-conversion pipeline below, not a second markdown-aware code path,
 * so a "## Heading" pasted as plain text produces the same HeadingBlock a "## Heading" typed into
 * Google Docs and copied as rich text would. Plain text with no markdown syntax at all still
 * degrades correctly -- marked wraps line-break-separated text in <p> tags on its own. */
function markdownToHtml(text: string): string {
  return marked.parse(text, { gfm: true, breaks: true, async: false });
}

// ─── Google Docs' neutral-bold wrapper ─────────────────────────────────────
// Google Docs wraps an entire paste in `<b id="docs-internal-guid-...">` with
// `style="font-weight:normal"` -- a real `<b>` tag that isn't semantically bold at all. Applied
// once, up front, over the *whole* parsed tree (not just top-level children), because unlike the
// general structural rule in walkChildren (which only ever looks at direct block-level children
// while walking element-by-element), this wrapper can also end up nested *inside* a paragraph's
// inline content rather than wrapping block-level siblings -- a shape the block-walker's own
// check, by design, never sees (that content is handled by generateJSON, not the walker). This is
// secondary, tool-specific cleanup layered on top of the general rule, not the primary defense
// against a wrapper collapsing the whole paste into one block -- see INLINE_MARK_TAGS above for
// that. Whether text ends up bold is still entirely Bold's own `parseHTML` decision either way
// (it already excludes `font-weight:normal`); unwrapping here only stops this tag from acting as
// a *structural* container, it doesn't itself decide bold-ness.

function isNeutralBoldWrapper(el: Element): boolean {
  if (el.tagName !== "B" && el.tagName !== "STRONG") return false;
  if (el.id.startsWith("docs-internal-guid")) return true;
  const style = el.getAttribute("style") ?? "";
  return /font-weight\s*:\s*normal/i.test(style);
}

function unwrapElement(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function normalizeDocument(root: Element): void {
  // querySelectorAll returns a static snapshot, so removing/unwrapping elements while iterating
  // it is safe -- a nested match (a wrapper inside another wrapper, however unlikely) is still in
  // the list and still has a valid parentNode to unwrap from after an earlier iteration already
  // moved it.
  for (const el of Array.from(root.querySelectorAll("b, strong"))) {
    if (isNeutralBoldWrapper(el)) unwrapElement(el);
  }
}

// ─── Block-level walk ───────────────────────────────────────────────────────

function walkChildren(parent: ParentNode, out: ContentBlock[]): void {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) continue;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/ /g, " ").trim();
      if (text) out.push({ ...createParagraphBlock(), text });
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    const tag = el.tagName;

    if (SKIP_TAGS.has(tag)) continue;

    // Primary protection against "an inline wrapper collapses the whole paste into one block" --
    // checked and applied before anything else, per the tag-general rule above.
    if (INLINE_MARK_TAGS.has(tag) && containsBlockLevelChild(el)) {
      walkChildren(el, out); // transparent inline-tag container -- descend without producing a block
      continue;
    }

    switch (tag) {
      case "P":
        pushParagraph(el, out);
        continue;
      case "H1":
      case "H2":
        pushHeading(el, "h2", out);
        continue;
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        pushHeading(el, "h3", out);
        continue;
      case "UL":
        pushList(el, "bullet", out);
        continue;
      case "OL":
        pushList(el, "ordered", out);
        continue;
      case "BLOCKQUOTE":
        pushQuote(el, out);
        continue;
      case "HR":
        out.push(createDividerBlock());
        continue;
      case "PRE":
      case "CODE":
        pushCodeParagraph(el, out);
        continue;
      case "TABLE":
        pushTableRows(el, out);
        continue;
      case "IMG":
        continue; // images are dropped entirely, per spec -- no ImageBlock is created from paste
    }

    if (WRAPPER_TAGS.has(tag)) {
      walkChildren(el, out); // transparent structural wrapper -- descend without producing a block
      continue;
    }

    // Anything else (a loose inline element at block level -- <a>, <b>, <span>, an unrecognized
    // custom tag, ...): if it structurally contains real block content, treat it the same as a
    // wrapper and descend; otherwise treat the element itself as one paragraph's worth of inline
    // content (keeping its own mark, if it has a recognized one -- e.g. a bare top-level <a href>
    // still needs its own tag considered, not just its text, so a safe link stays a link and an
    // unsafe one correctly loses its mark via the same schema-constrained parse everything else
    // goes through).
    if (containsBlockLevelChild(el)) {
      walkChildren(el, out);
    } else {
      pushInlineFallback(el, out);
    }
  }
}

function containsBlockLevelChild(el: Element): boolean {
  return Array.from(el.children).some((child) => BLOCK_LEVEL_TAGS.has(child.tagName));
}

// ─── Per-tag conversions ────────────────────────────────────────────────────
// ParagraphBlock is the only block type that carries a TipTapDocument -- HeadingBlock, ListBlock
// items, and QuoteBlock are plain strings in the current schema (see contentBlocks.ts), so those
// three use trimmed textContent directly rather than going through generateJSON at all.

/** Converts an element's *own* innerHTML into a TipTapDocument by wrapping it in a synthetic <p>
 * and parsing that through the shared, schema-constrained extension set -- the one place this
 * file produces rich (marked-up) paragraph content instead of a plain string. Returns null for
 * anything that comes out empty (an empty <p>, one holding only &nbsp;/<br>, ...) -- callers use
 * that to implement "drop empty paragraphs" (Word/Google Docs insert these purely for spacing). */
function inlineHtmlToDoc(innerHtml: string): TipTapDocument | null {
  if (!innerHtml.trim()) return null;
  const json = generateJSON(`<p>${innerHtml}</p>`, richTextExtensions) as TipTapDocument;
  return isTipTapDocEmpty(json) ? null : json;
}

function hasVisibleText(el: Element): boolean {
  return (el.textContent ?? "").replace(/ /g, " ").trim().length > 0;
}

function pushParagraph(el: Element, out: ContentBlock[]): void {
  if (!hasVisibleText(el)) return; // empty <p>, or one holding only &nbsp;/<br> -- dropped, not an empty ParagraphBlock
  const doc = inlineHtmlToDoc(el.innerHTML);
  if (doc === null) return;
  out.push({ ...createParagraphBlock(), text: doc });
}

/** The fallback for a loose inline element found at block level (see walkChildren's default
 * case) -- uses outerHTML, not innerHTML, so the element's *own* tag (and whatever mark it
 * represents) is part of what gets parsed, not discarded before parsing even starts. */
function pushInlineFallback(el: Element, out: ContentBlock[]): void {
  if (!hasVisibleText(el)) return;
  const doc = inlineHtmlToDoc(el.outerHTML);
  if (doc === null) return;
  out.push({ ...createParagraphBlock(), text: doc });
}

function pushHeading(el: Element, level: HeadingLevel, out: ContentBlock[]): void {
  const text = (el.textContent ?? "").trim();
  if (!text) return;
  out.push({ ...createHeadingBlock(level), text });
}

function pushQuote(el: Element, out: ContentBlock[]): void {
  const text = (el.textContent ?? "").trim();
  if (!text) return;
  out.push({ ...createQuoteBlock(), text });
}

function pushList(el: Element, style: ListStyle, out: ContentBlock[]): void {
  const items: string[] = [];
  collectListItems(el, items);
  if (items.length === 0) return;
  out.push({ ...createListBlock(), style, items });
}

/** Nested lists flatten into the parent list's items (per spec -- indentation isn't preserved by
 * this schema's flat ListBlock.items: string[], so there's nothing to keep it in). A <li>'s own
 * direct text and any lists nested inside it are read separately (via a clone with the nested
 * list removed) so a sub-item's text never gets glued onto its parent item's text. */
function collectListItems(listEl: Element, items: string[]): void {
  for (const child of Array.from(listEl.children)) {
    if (child.tagName !== "LI") continue;

    const withoutNestedLists = child.cloneNode(true) as Element;
    Array.from(withoutNestedLists.querySelectorAll("ul, ol")).forEach((nested) => nested.remove());
    const ownText = (withoutNestedLists.textContent ?? "").trim();
    if (ownText) items.push(ownText);

    Array.from(child.querySelectorAll(":scope > ul, :scope > ol")).forEach((nested) => {
      collectListItems(nested, items);
    });
  }
}

/** A3-fix: `<pre>`/block-level `<code>` used to go through `hasVisibleText`+plain-string, which
 * meant its textContent eventually reached `generateJSON` (either directly as a string, or by
 * whatever downstream rendering treats a plain-string ParagraphBlock as HTML) and every "\n" in
 * it collapsed into a single space, per normal HTML whitespace handling -- a 7-line ASCII diagram
 * became one line. Built directly as a TipTapDocument instead, entirely bypassing the HTML/TipTap
 * parser for this one conversion, so newlines are preserved as explicit hardBreak nodes rather
 * than characters that a parser would collapse. */
function pushCodeParagraph(el: Element, out: ContentBlock[]): void {
  const doc = codeTextToDoc(el.textContent ?? "");
  if (doc === null) return;
  out.push({ ...createParagraphBlock(), text: doc });
}

/** Splits raw `<pre>`/`<code>` text on "\n" into one hardBreak-joined line per source line. Each
 * line is trimmed (so the editor and the eventual public renderer -- which does not preserve
 * leading whitespace -- show the same thing), leading/trailing blank lines are dropped (typically
 * just the newline right after `<pre>` opens and right before it closes), and a blank line in the
 * *middle* of the block contributes only its hardBreak, never a `{ type: "text", text: "" }` node
 * -- ProseMirror's schema rejects a text node with empty text, so that case has to be handled as
 * "just the line break, no text node" rather than "a text node holding an empty string". */
function codeTextToDoc(rawText: string): TipTapDocument | null {
  const lines = rawText.split("\n").map((line) => line.trim());

  let start = 0;
  while (start < lines.length && lines[start] === "") start++;
  let end = lines.length - 1;
  while (end >= start && lines[end] === "") end--;

  if (start > end) return null; // nothing but blank lines

  const content: TipTapDocument[] = [];
  for (let i = start; i <= end; i++) {
    if (i > start) content.push({ type: "hardBreak" });
    if (lines[i] !== "") content.push({ type: "text", text: lines[i] });
  }
  if (content.length === 0) return null;

  return { type: "doc", content: [{ type: "paragraph", content }] };
}

function pushTableRows(el: Element, out: ContentBlock[]): void {
  for (const row of Array.from(el.querySelectorAll("tr"))) {
    const cells = Array.from(row.querySelectorAll("td, th"))
      .map((cell) => (cell.textContent ?? "").trim())
      .filter(Boolean);
    if (cells.length === 0) continue;
    // Temporary, until a real TableBlock exists -- see contentSchemaNotes.md's A3 section.
    out.push({ ...createParagraphBlock(), text: cells.join(" · ") });
  }
}

// ─── Word bullet-paragraph collapsing ───────────────────────────────────────
// Word's paste doesn't use real <ul>/<li> for its bulleted-list style -- it emits plain <p>
// elements whose text happens to start with a bullet glyph. Detected here, as a post-process over
// the already-flat block array, rather than during the DOM walk itself, since it's fundamentally
// a different kind of pattern (a *run* of consecutive paragraphs), not a single-element rule.

function extractPlainText(text: string | TipTapDocument): string {
  if (typeof text === "string") return text;
  let out = "";
  const walk = (node: TipTapDocument | undefined): void => {
    if (!node) return;
    if (typeof node.text === "string") out += node.text;
    (node.content ?? []).forEach(walk);
  };
  walk(text);
  return out;
}

function collapseWordBulletParagraphs(blocks: ContentBlock[]): ContentBlock[] {
  const out: ContentBlock[] = [];
  let run: string[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    out.push({ ...createListBlock(), style: "bullet", items: run });
    run = [];
  };

  for (const block of blocks) {
    if (block.type === "paragraph") {
      const plain = extractPlainText(block.text);
      const match = plain.match(WORD_BULLET_PREFIX);
      if (match) {
        run.push(plain.slice(match[0].length));
        continue;
      }
    }
    flushRun();
    out.push(block);
  }
  flushRun();

  return out;
}
