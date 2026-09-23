"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { Bold, Highlighter, Italic, Link as LinkIcon, Unlink, X } from "lucide-react";
import { isSafeHref } from "@/lib/richText";
import type { TipTapDocument } from "@/lib/tiptapContent";

/** Enter inserts a hard break instead of splitting into a second paragraph node -- keeps typed
 * input to "one ParagraphBlock is one paragraph" (matching Phase 2.1's contentEditable behavior),
 * so adding another paragraph stays a BlockToolbar action, not something Enter can do by
 * accident. Only overrides plain Enter; Shift-Enter already inserts a hard break by itself via
 * HardBreak's own default shortcut, so this doesn't need to touch that. */
const SingleParagraphEnter = Extension.create({
  name: "singleParagraphEnter",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    };
  },
});

interface RichTextInputProps {
  id: string;
  value: string | TipTapDocument;
  onChange: (value: TipTapDocument) => void;
  placeholder?: string;
  align?: "left" | "center" | "right";
}

const TOOLBAR_BTN =
  "admin-focus-ring flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none";

function activeStyle(active: boolean): React.CSSProperties {
  return active
    ? { background: "var(--admin-primary-soft)", color: "var(--admin-primary)" }
    : { color: "var(--admin-text-muted)" };
}

/** `value` is fed straight to TipTap's `content` option as-is: a legacy plain string, or the
 * constrained HTML string Phase 2.1's editor produced, is valid `HTMLContent` and TipTap parses
 * it through this component's own restricted schema (only bold/italic/link survive; anything
 * else is dropped the same way an unrecognized paste is) -- so an old ParagraphBlock opens
 * looking exactly as it did before, with zero conversion step. A TipTapDocument is valid
 * `JSONContent` and loads directly. Either way, the *first* edit's onUpdate always emits a
 * TipTapDocument -- that's the one-way, lazy, edit-triggered upgrade this schema change relies
 * on (see contentSchemaNotes.md). */
function resolveInitialContent(value: string | TipTapDocument): Content {
  return value as Content;
}

/**
 * TipTap-based rich text input for ParagraphBlock, replacing Phase 2.1's contentEditable +
 * execCommand implementation (RichTextEditor.tsx, removed this phase). Controlled the same way
 * every other block editor is: `value` in, `onChange` out, no state owned beyond what TipTap
 * itself needs to run its own editor instance.
 *
 * Scope is deliberately narrow -- Bold, Italic, Link, Highlight only. Every other StarterKit node
 * (headings, lists, blockquote, code block, horizontal rule, strike, underline) is turned off in
 * the extension config below, which does double duty as the paste sanitizer: ProseMirror's HTML
 * paste parser only ever produces node/mark types this editor's schema actually registers, so a
 * paste from Word/Docs/a web page loses font styles, colors, and any structure outside this list
 * for free, without a separate cleanup pass -- there is no schema slot for them to land in.
 *
 * Enter inserts a hard break rather than splitting into a second paragraph node, matching Phase
 * 2.1's `defaultParagraphSeparator: "br"` behavior: one ParagraphBlock is still one paragraph.
 * Adding another paragraph stays a BlockToolbar action, not something typing inside this one can
 * accidentally do. A multi-paragraph HTML paste is the one case that can still produce more than
 * one paragraph node in the doc (pasted structure is preserved, not merged) -- RichTextRenderer
 * renders that correctly if it happens, so it degrades gracefully rather than breaking anything.
 */
export default function RichTextInput({ id, value, onChange, placeholder, align = "left" }: RichTextInputProps) {
  const lastEmittedRef = useRef<string | TipTapDocument>(value);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const editor = useEditor({
    // Next.js renders once on the server for the initial HTML; TipTap's own guidance for SSR
    // frameworks is to disable that first render and let the client mount the editor, avoiding a
    // hydration mismatch (the editor's internal ids differ between the two passes otherwise).
    immediatelyRender: false,
    content: resolveInitialContent(value),
    extensions: [
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
        // Belt-and-suspenders with the manual isSafeHref() check in handleInsertLink below --
        // this gate covers autolink-while-typing and link-on-paste, which never go through that
        // handler at all.
        isAllowedUri: (url, ctx) => isSafeHref(url) && ctx.defaultValidate(url),
      }),
      Highlight.configure({
        multicolor: false, // one fixed color -- no color picker, per spec
        HTMLAttributes: { class: "cs-highlight" },
      }),
      SingleParagraphEnter,
    ],
    editorProps: {
      attributes: {
        id,
        class: "admin-input min-h-[84px]",
        role: "textbox",
        "aria-multiline": "true",
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      lastEmittedRef.current = json;
      onChange(json);
    },
  });

  // External value changes (loading a different document, switching blocks) sync into the
  // running editor instance. Guarded against re-applying the editor's own just-emitted value --
  // ContentStudio/useContentEditor never mutates a block in place, only replaces it wholesale via
  // onChange, so the object this component receives back as `value` after its own edit is the
  // exact same reference it handed up; skipping that case is what keeps the cursor from jumping
  // to the start on every keystroke (the same problem Phase 2.1's contentEditable sync effect
  // solved, adapted here for a JSON value instead of an HTML string).
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    editor.commands.setContent(resolveInitialContent(value), { emitUpdate: false });
  }, [value, editor]);

  function openLinkPopover() {
    // Pre-fills with the current link's href when the cursor is already inside one, so editing
    // an existing link doesn't mean retyping it from scratch.
    const currentHref = editor?.getAttributes("link").href;
    setLinkUrl(typeof currentHref === "string" ? currentHref : "");
    setLinkError(null);
    setLinkPopoverOpen(true);
  }

  function closeLinkPopover() {
    setLinkPopoverOpen(false);
    setLinkError(null);
    editor?.commands.focus();
  }

  function handleInsertLink() {
    const url = linkUrl.trim();
    if (!url) {
      setLinkError("Vui lòng nhập đường dẫn.");
      return;
    }
    // Explicit re-check here, not just relying on the extension's isAllowedUri config above --
    // that gate is for autolink/paste; this direct setLink() call bypasses it entirely, so the
    // same protocol validation has to happen again right before this specific command runs.
    if (!isSafeHref(url)) {
      setLinkError("Đường dẫn không hợp lệ. Chỉ chấp nhận http, https hoặc mailto.");
      return;
    }
    if (!editor) return;

    if (editor.state.selection.empty) {
      // Nothing selected -- insert the URL itself as the link's visible text, rather than
      // silently doing nothing (a button with no visible effect reads as broken).
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url, target: "_blank", rel: "noopener noreferrer" } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
    }

    setLinkPopoverOpen(false);
    setLinkError(null);
  }

  function handleRemoveLink() {
    editor?.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkError(null);
  }

  function handleLinkKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInsertLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeLinkPopover();
    }
  }

  const isEmpty = !editor || editor.isEmpty;
  const linkActive = editor?.isActive("link") ?? false;

  return (
    <div>
      <div
        className="mb-1.5 flex items-center gap-1 rounded-lg p-1"
        style={{ background: "var(--admin-surface-muted)", border: "1px solid var(--admin-border)" }}
        role="toolbar"
        aria-label="Định dạng văn bản"
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || !editor.can().chain().focus().toggleBold().run()}
          aria-label="In đậm"
          aria-pressed={editor?.isActive("bold") ?? false}
          title="In đậm"
          className={TOOLBAR_BTN}
          style={activeStyle(editor?.isActive("bold") ?? false)}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || !editor.can().chain().focus().toggleItalic().run()}
          aria-label="In nghiêng"
          aria-pressed={editor?.isActive("italic") ?? false}
          title="In nghiêng"
          className={TOOLBAR_BTN}
          style={activeStyle(editor?.isActive("italic") ?? false)}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
          disabled={!editor || !editor.can().chain().focus().toggleHighlight().run()}
          aria-label="Đánh dấu nổi bật"
          aria-pressed={editor?.isActive("highlight") ?? false}
          title="Đánh dấu nổi bật"
          className={TOOLBAR_BTN}
          style={activeStyle(editor?.isActive("highlight") ?? false)}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPopover}
          disabled={!editor}
          aria-label="Chèn liên kết"
          aria-pressed={linkActive}
          title="Chèn liên kết"
          className={TOOLBAR_BTN}
          style={activeStyle(linkActive)}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {linkPopoverOpen && (
        <div className="mb-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={linkUrl}
              onChange={(e) => { setLinkUrl(e.target.value); if (linkError) setLinkError(null); }}
              onKeyDown={handleLinkKeyDown}
              placeholder="https://..."
              aria-label="Đường dẫn liên kết"
              className="admin-input flex-1 font-mono text-xs"
            />
            <button type="button" onClick={handleInsertLink} className="admin-focus-ring shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white" style={{ background: "var(--admin-primary)" }}>
              Chèn
            </button>
            {linkActive && (
              <button type="button" onClick={handleRemoveLink} aria-label="Xóa liên kết" title="Xóa liên kết" className="admin-focus-ring shrink-0 rounded-lg p-1.5" style={{ color: "var(--admin-danger)" }}>
                <Unlink size={14} />
              </button>
            )}
            <button type="button" onClick={closeLinkPopover} aria-label="Hủy chèn liên kết" className="admin-focus-ring shrink-0 rounded-lg p-1.5" style={{ color: "var(--admin-text-subtle)" }}>
              <X size={14} />
            </button>
          </div>
          {linkError && (
            <p role="alert" className="mt-1 text-[11px]" style={{ color: "var(--admin-danger)" }}>{linkError}</p>
          )}
        </div>
      )}

      <div className="relative" style={{ textAlign: align }}>
        <EditorContent editor={editor} />
        {isEmpty && placeholder && (
          <span
            className="pointer-events-none absolute top-2 text-sm"
            style={{
              color: "var(--admin-text-placeholder)",
              left: align === "left" ? "0.75rem" : 0,
              right: align === "right" ? "0.75rem" : 0,
              textAlign: align,
            }}
          >
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}
