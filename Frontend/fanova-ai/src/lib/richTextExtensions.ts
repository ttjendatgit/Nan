/**
 * The TipTap extension set ParagraphBlock's rich text is built on -- Bold, Italic, Link,
 * Highlight, on top of StarterKit with everything else (headings, lists, blockquote, code block,
 * horizontal rule, strike, underline) turned off. Moved out of RichTextInput.tsx (Phase A3) so it
 * can be shared with lib/pasteToBlocks.ts's clipboard-to-blocks conversion: pasted HTML is parsed
 * through this exact same array via `generateJSON`, which is what makes a paste go through the
 * identical schema-constrained sanitization the live editor already relies on for its own native
 * paste handling -- no font styles, no color, no disallowed nodes, and every link's href gated by
 * the same `isAllowedUri` check (so `javascript:`/other unsafe protocols are rejected the same
 * way regardless of which code path parsed the HTML). There must be exactly one configured copy
 * of this array in the whole app; a second, separately-configured copy would be exactly the kind
 * of drift this sharing is meant to prevent.
 *
 * Configuration is unchanged from what RichTextInput.tsx had inline before this phase -- moved
 * verbatim, not retuned.
 */

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import type { AnyExtension } from "@tiptap/core";
import { isSafeHref } from "@/lib/richText";

export const richTextExtensions: AnyExtension[] = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    strike: false,
    code: false,
    underline: false,
    // Disabled here so the explicitly-installed, explicitly-configured Link extension below
    // (with our protocol allowlist) is the only Link instance registered -- StarterKit would
    // otherwise register its own with default (unrestricted) options.
    link: false,
  }),
  Link.configure({
    openOnClick: false, // this is an editor, not a reader -- a click should place the cursor, not navigate away
    autolink: true,
    linkOnPaste: true,
    protocols: ["http", "https", "mailto"],
    defaultProtocol: "https",
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    // Belt-and-suspenders with the manual isSafeHref() check RichTextInput's own link popover
    // does before calling setLink() directly -- this gate covers autolink-while-typing,
    // link-on-paste, and (as of Phase A3) pasteToBlocks.ts's generateJSON-based HTML parsing,
    // none of which go through that popover's own handler.
    isAllowedUri: (url, ctx) => isSafeHref(url) && ctx.defaultValidate(url),
  }),
  Highlight.configure({
    multicolor: false, // one fixed color -- no color picker, per spec
    HTMLAttributes: { class: "cs-highlight" },
  }),
];
