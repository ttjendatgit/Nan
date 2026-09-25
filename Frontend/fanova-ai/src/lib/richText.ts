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
    // No DOM (server rendering of the public /[slug] pages, Content Studio B2): same allowlist,
    // applied without a DOM -- see sanitizeWithoutDom.
    return sanitizeWithoutDom(html);
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  Array.from(container.children).forEach(sanitizeElement);
  return container.innerHTML;
}

const HTML_WHITESPACE = /[\t\n\f\r ]/;

/** Text between tags: `<`/`>` escaped, and `&` escaped unless it already starts an entity
 * reference -- so entities reach the browser exactly as the DOM path would have kept them. */
function escapeTextSegment(text: string): string {
  return text
    .replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Like the HTML parser: NUL, surrogates and anything past U+10FFFF become U+FFFD instead of
 * throwing (String.fromCodePoint throws a RangeError for them). */
function codePointOrReplacement(value: number): string {
  if (!Number.isFinite(value) || value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
    return "�";
  }
  return String.fromCodePoint(value);
}

const NAMED_ATTRIBUTE_ENTITIES: Record<string, string> = { quot: '"', apos: "'", lt: "<", gt: ">", amp: "&" };

/** Single pass, so an already-decoded "&" can never start a second decode ("&#38;lt;" -> "&lt;",
 * not "<"). Numeric references are decoded with or without the trailing ";", as the browser does. */
function decodeAttributeValue(value: string): string {
  return value.replace(
    /&(?:#[xX]([0-9a-fA-F]+);?|#([0-9]+);?|(quot|apos|lt|gt|amp);)/g,
    (_match: string, hex: string | undefined, dec: string | undefined, named: string | undefined) => {
      if (hex !== undefined) return codePointOrReplacement(parseInt(hex, 16));
      if (dec !== undefined) return codePointOrReplacement(parseInt(dec, 10));
      return NAMED_ATTRIBUTE_ENTITIES[named ?? ""] ?? "";
    },
  );
}

interface ParsedTag {
  closing: boolean;
  /** Uppercased, like Element.tagName. */
  name: string;
  /** Lowercased names; the first occurrence wins, as in the HTML parser. Raw (undecoded) values. */
  attributes: Map<string, string>;
  selfClosing: boolean;
  /** Index just past the tag's closing ">". */
  end: number;
}

function isTagDelimiter(ch: string): boolean {
  return HTML_WHITESPACE.test(ch) || ch === "/" || ch === ">";
}

/**
 * Reads one start/end tag beginning at html[start] === "<", following the HTML tokenizer's rules
 * for the parts that matter here: the tag name runs until whitespace, "/" or ">"; attribute names
 * are delimited by whitespace, "/", ">" and "=", so "data-href" is its own attribute and never
 * "href"; quoted values run to the matching quote, so a ">" or "href=" inside `title="…"` is just
 * part of that value. Returns "text" when "<" doesn't start a tag (e.g. "5 < 6"), and "eof" when
 * the input ends inside the tag -- the HTML parser emits nothing for such a tag.
 */
function readTag(html: string, start: number): ParsedTag | "text" | "eof" {
  const length = html.length;
  let p = start + 1;
  const closing = html[p] === "/";
  if (closing) p++;
  if (!/[a-zA-Z]/.test(html[p] ?? "")) return "text";

  const nameStart = p;
  while (p < length && !isTagDelimiter(html[p])) p++;
  const name = html.slice(nameStart, p).toUpperCase();

  const attributes = new Map<string, string>();
  let selfClosing = false;
  for (;;) {
    while (p < length && HTML_WHITESPACE.test(html[p])) p++;
    if (p >= length) return "eof";
    if (html[p] === ">") {
      p++;
      break;
    }
    if (html[p] === "/") {
      p++;
      if (html[p] === ">") {
        selfClosing = true;
        p++;
        break;
      }
      continue; // a stray "/" inside a tag is ignored
    }

    // Attribute name: its first character may be anything (even "="), the rest stop at a delimiter.
    const attrStart = p++;
    while (p < length && !isTagDelimiter(html[p]) && html[p] !== "=") p++;
    const attrName = html.slice(attrStart, p).toLowerCase();
    while (p < length && HTML_WHITESPACE.test(html[p])) p++;

    let value = "";
    if (html[p] === "=") {
      p++;
      while (p < length && HTML_WHITESPACE.test(html[p])) p++;
      const quote = html[p];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, p + 1);
        if (close === -1) return "eof";
        value = html.slice(p + 1, close);
        p = close + 1;
      } else {
        const valueStart = p;
        while (p < length && !HTML_WHITESPACE.test(html[p]) && html[p] !== ">") p++;
        value = html.slice(valueStart, p);
      }
    }
    if (!attributes.has(attrName)) attributes.set(attrName, value);
  }

  return { closing, name, attributes, selfClosing, end: p };
}

/** Index just past a comment / bogus comment ("<!…>", "<?…>", "</ …>") starting at `start`. */
function skipComment(html: string, start: number): number {
  if (html.startsWith("<!--", start)) {
    const close = html.indexOf("-->", start + 4);
    return close === -1 ? html.length : close + 3;
  }
  const close = html.indexOf(">", start + 1);
  return close === -1 ? html.length : close + 1;
}

/** The validated href for an <a>, or null. A named entity this decoder doesn't know (e.g.
 * "java&Tab;script:") would be decoded by the browser into something isSafeHref never saw -- such
 * an href is dropped, not guessed at. */
function safeHrefFrom(rawHref: string | undefined): string | null {
  if (!rawHref) return null;
  if (/&(?!(?:quot|apos|lt|gt|amp);)[a-zA-Z][a-zA-Z0-9]*;/.test(rawHref)) return null;
  const href = decodeAttributeValue(rawHref);
  return href && isSafeHref(href) ? href : null;
}

/**
 * DOM-free counterpart of the DOM path above, enforcing the same rules: ALLOWED_TAGS kept (their
 * attributes dropped except a safe <a href>, which gets target/rel added), REMOVE_ENTIRELY
 * elements dropped with their content, any other tag unwrapped (its text kept), comments dropped.
 *
 * Safe by construction rather than by pattern-matching what's dangerous: the output is rebuilt
 * from scratch -- every text segment is escaped, and the only markup ever emitted is the fixed
 * set of tags written out below, with the one attribute value (href) validated by isSafeHref and
 * then HTML-escaped, so the browser receives exactly the string that was validated. Unbalanced
 * closing tags are ignored and anything left open is closed at the end. Never throws on any
 * input string.
 */
function sanitizeWithoutDom(html: string): string {
  const out: string[] = [];
  const open: string[] = [];
  let skipping: string | null = null;
  let textStart = 0;
  let p = 0;

  const emitText = (text: string) => {
    if (text && !skipping) out.push(escapeTextSegment(text));
  };

  while (p < html.length) {
    const lt = html.indexOf("<", p);
    if (lt === -1) break;
    const next = html[lt + 1];

    // "<!…>", "<?…>" and "</" + non-letter are comments / bogus comments, dropped like the HTML
    // parser does -- except a lone trailing "<" or "</", which stays text.
    const isBogusEndTag = next === "/" && lt + 2 < html.length && !/[a-zA-Z]/.test(html[lt + 2]);
    if (next === "!" || next === "?" || isBogusEndTag) {
      emitText(html.slice(textStart, lt));
      p = textStart = skipComment(html, lt);
      continue;
    }

    const tag = readTag(html, lt);
    if (tag === "text") {
      p = lt + 1; // this "<" stays part of the current text run
      continue;
    }
    emitText(html.slice(textStart, lt));
    if (tag === "eof") {
      p = textStart = html.length;
      break;
    }
    p = textStart = tag.end;

    const { closing, name, selfClosing } = tag;
    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }
    if (REMOVE_ENTIRELY.has(name)) {
      if (!closing && !selfClosing) skipping = name;
      continue;
    }
    if (!ALLOWED_TAGS.has(name)) continue; // unwrapped: tag dropped, text around it kept

    const tagName = name.toLowerCase();
    if (name === "BR") {
      if (!closing) out.push("<br>");
      continue;
    }

    if (closing) {
      const at = open.lastIndexOf(tagName);
      if (at === -1) continue;
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }

    if (name === "A") {
      const href = safeHrefFrom(tag.attributes.get("href"));
      out.push(href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">` : "<a>");
    } else {
      out.push(`<${tagName}>`);
    }
    open.push(tagName);
  }

  emitText(html.slice(textStart));
  while (open.length > 0) out.push(`</${open.pop()}>`);
  return out.join("");
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
