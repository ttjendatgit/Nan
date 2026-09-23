/**
 * Structural validation for TipTap JSON stored in ParagraphBlock.text (Phase 2.3.1). Mirrors
 * lib/richText.ts's role for the legacy plain-text/constrained-HTML-string path: this is the
 * equivalent trust boundary for the new TipTap-JSON path, used at both parse time
 * (types/contentBlocks.ts, when a document loads from the API) and render time
 * (components/content/RichTextRenderer.tsx) -- never trusted blindly at either point, matching
 * the project's established defense-in-depth pattern from Phase 2.1.
 *
 * Unlike the legacy path, this never touches dangerouslySetInnerHTML: TipTap content is typed
 * JSON data, and RichTextRenderer only ever turns it into React elements directly (no HTML
 * string, no innerHTML assignment anywhere), so there is no markup-injection surface to sanitize
 * away here. The concern this file guards against is different -- malformed, truncated, or
 * hand-edited JSON crashing the renderer -- so the checks below are deliberately shallow
 * "is this even plausibly a TipTap doc" checks, not a full ProseMirror schema validator.
 * RichTextRenderer still treats every individual node/mark defensively on top of this (unknown
 * node/mark types degrade gracefully, link hrefs are re-validated independently), the same
 * "don't trust one layer alone" posture sanitizeRichText already established.
 */

import type { JSONContent } from "@tiptap/core";

export type TipTapDocument = JSONContent;

/** Shallow shape check -- `{ type: "doc", content: [...] }`. Good enough to distinguish "this is
 * TipTap JSON" from "this is something else" (a plain string, null, a stray object) before
 * treating it as such; not a guarantee every node/mark inside is one our editor recognizes. */
export function isTipTapDocument(value: unknown): value is TipTapDocument {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.type === "doc" && (v.content === undefined || Array.isArray(v.content));
}

/** True when a TipTap doc has no visible text anywhere in its node tree -- the JSON-document
 * equivalent of lib/richText.ts's isRichTextEmpty. A brand-new/never-edited TipTap doc (just an
 * empty paragraph node) and a doc that's been typed into and fully deleted both come out empty
 * here, matching how the legacy string path already treats "" and "<br>" alike as empty. */
export function isTipTapDocEmpty(doc: TipTapDocument): boolean {
  function hasText(node: JSONContent | undefined): boolean {
    if (!node) return false;
    if (typeof node.text === "string" && node.text.length > 0) return true;
    return (node.content ?? []).some(hasText);
  }
  return !hasText(doc);
}
