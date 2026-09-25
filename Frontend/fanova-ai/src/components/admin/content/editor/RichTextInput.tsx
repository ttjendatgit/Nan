"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import { Bold, Highlighter, Italic, Link as LinkIcon, Scissors, Unlink, X } from "lucide-react";
import { isSafeHref } from "@/lib/richText";
import type { TipTapDocument } from "@/lib/tiptapContent";
import { richTextExtensions } from "@/lib/richTextExtensions";

/**
 * What "Tách khối tại con trỏ" hands back to the block layer: this block's doc cut at the cursor.
 * Both halves are cut from the live ProseMirror doc via `Node.cut()`, not by slicing text, so every
 * mark spanning the cut point (bold, italic, link, highlight) survives on whichever side it ends up
 * on, and every inner paragraph stays in order on its own side.
 */
export interface ParagraphSplitPayload {
  /** Everything up to the cursor -- stays in the current block. */
  before: TipTapDocument;
  /** Everything from the cursor on -- becomes a new paragraph block right below. */
  after: TipTapDocument;
}

/**
 * What Backspace hands back to the block layer when it's pressed at the very start of a
 * paragraph's content (A2, Enter's inverse). `doc` is this block's entire current content --
 * unlike Enter, there's nothing to cut, since the whole block is either getting deleted or merged
 * wholesale into the previous one. `isEmpty` is included rather than left for the caller to derive
 * from `doc` because "is a TipTap doc empty" is exactly the judgment call `editor.isEmpty` (and
 * lib/tiptapContent.ts's isTipTapDocEmpty) already exists to make -- no reason to make the caller
 * re-derive it from raw JSON.
 */
export interface ParagraphBackspacePayload {
  isEmpty: boolean;
  doc: TipTapDocument;
}

interface RichTextInputProps {
  id: string;
  value: string | TipTapDocument;
  onChange: (value: TipTapDocument) => void;
  placeholder?: string;
  align?: "left" | "center" | "right";
  /** Enables the toolbar's "Tách khối tại con trỏ" action: splits this block into two at the
   * (collapsed) cursor and hands both halves up. Enter itself never splits the block any more --
   * it adds a paragraph inside this same block (TipTap's own behavior). Without this prop the
   * button isn't shown. */
  onSplitAtCursor?: (payload: ParagraphSplitPayload) => void;
  /** A2: handles a plain Backspace pressed at the very start of this paragraph's content
   * (collapsed selection) -- reports whether the block is empty and its full current doc, and
   * lets the block layer decide whether to delete this block or merge it into the previous one.
   * Same "safe no-op when absent" contract as onEnter: without this wired, Backspace at the start
   * just falls through to TipTap's own default behavior instead of deleting/merging anything. */
  onBackspaceAtStart?: (payload: ParagraphBackspacePayload) => void;
  /** false (or omitted): no auto-focus. "start"/"end": focuses that end of this editor once it's
   * mounted and ready. A1's newly split-off block uses "start"; A2's target block (the one that
   * just absorbed a merge) uses "end" -- the cursor's exact join-point position is set explicitly
   * by the pendingMerge effect below, but the editor still needs DOM focus to place it there. */
  autoFocus?: false | "start" | "end";
  /** A2: a merge in progress -- content from a block that's about to be deleted, to be spliced
   * onto the end of THIS editor's own content. Set by ContentStudio via useContentEditor's
   * pendingMerge/requestMerge; see the effect below for why the splice happens here, in the
   * target block's own live editor, rather than as a JSON operation at the state layer. */
  pendingMerge?: TipTapDocument | null;
  /** Called once the pendingMerge effect below has applied the merge, so the caller can clear
   * pendingMerge back to null -- otherwise the same merge would reapply on every future render
   * where pendingMerge is still set. */
  onMergeApplied?: () => void;
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

function isEmptyParagraph(node: TipTapDocument | undefined): boolean {
  return node?.type === "paragraph" && (!node.content || node.content.length === 0);
}

/** Drops empty paragraphs from one edge of a cut doc (keeping at least one paragraph, so an empty
 * half is still a valid, empty document). */
function trimEdgeEmptyParagraph(doc: TipTapDocument, edge: "start" | "end"): TipTapDocument {
  const content = [...(doc.content ?? [])];
  while (content.length > 1 && isEmptyParagraph(edge === "start" ? content[0] : content[content.length - 1])) {
    if (edge === "start") content.shift();
    else content.pop();
  }
  return { ...doc, content: content.length > 0 ? content : [{ type: "paragraph" }] };
}

/**
 * TipTap-based rich text input for ParagraphBlock, replacing Phase 2.1's contentEditable +
 * execCommand implementation (RichTextEditor.tsx, removed Phase 2.3.1). Controlled the same way
 * every other block editor is: `value` in, `onChange` out, no state owned beyond what TipTap
 * itself needs to run its own editor instance, plus the small amount of local UI state the Link
 * popover needs.
 *
 * Writing inside one block works like a regular editor: Enter adds a paragraph inside this same
 * block, Shift-Enter a soft line break, and a paste lands entirely in this block (TipTap's own
 * paste, through the schema below) with its paragraph breaks kept and the text around the cursor
 * or selection preserved -- a deliberate change from A1/A3, where Enter and multi-paragraph pastes
 * created new blocks. Two behaviors still reach the block layer, reported upward rather than
 * acting on the block array (this component has no concept of it): Backspace at the very start of
 * the block's content (A2, delete or merge into the previous block) and the explicit
 * "Tách khối tại con trỏ" split. See `onBackspaceAtStart` in handleKeyDown, `handleSplitAtCursor`,
 * and the `pendingMerge` effect for A2's merge case.
 *
 * Scope is deliberately narrow -- Bold, Italic, Link, Highlight only. Every other StarterKit node
 * (headings, lists, blockquote, code block, horizontal rule, strike, underline) is turned off in
 * the extension config below, which does double duty as the paste sanitizer: ProseMirror's HTML
 * paste parser only ever produces node/mark types this editor's schema actually registers, so a
 * paste from Word/Docs/a web page loses font styles, colors, and any structure outside this list
 * for free, without a separate cleanup pass -- there is no schema slot for them to land in.
 *
 * The Backspace interception lives in `editorProps.handleKeyDown`, not a keyboard-shortcut
 * Extension -- an Extension is `.create()`d once at module scope and would close over whatever
 * handler happened to be in scope at that point, not this specific render's prop -- so the handler
 * always reads the *latest* prop through a ref rather than closing over its value directly.
 */
export default function RichTextInput({
  id, value, onChange, placeholder, align = "left",
  onSplitAtCursor, onBackspaceAtStart, autoFocus, pendingMerge, onMergeApplied,
}: RichTextInputProps) {
  const lastEmittedRef = useRef<string | TipTapDocument>(value);
  const onBackspaceAtStartRef = useRef(onBackspaceAtStart);
  const onMergeAppliedRef = useRef(onMergeApplied);
  // Whether the selection is a plain cursor -- drives the split button's enabled state, which
  // must follow every selection change (the toolbar otherwise only re-renders on content changes).
  const [selectionCollapsed, setSelectionCollapsed] = useState(true);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    onBackspaceAtStartRef.current = onBackspaceAtStart;
  }, [onBackspaceAtStart]);

  useEffect(() => {
    onMergeAppliedRef.current = onMergeApplied;
  }, [onMergeApplied]);

  const editor = useEditor({
    // Next.js renders once on the server for the initial HTML; TipTap's own guidance for SSR
    // frameworks is to disable that first render and let the client mount the editor, avoiding a
    // hydration mismatch (the editor's internal ids differ between the two passes otherwise).
    immediatelyRender: false,
    content: resolveInitialContent(value),
    // The one shared, configured extension set (lib/richTextExtensions.ts). It is also the paste
    // sanitizer: a paste is parsed through this schema, so only paragraphs, hard breaks, bold,
    // italic, highlight and links whose href passes isAllowedUri can come through.
    extensions: richTextExtensions,
    editorProps: {
      attributes: {
        id,
        class: "admin-input min-h-[84px]",
        role: "textbox",
        "aria-multiline": "true",
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
      },
      // Only Backspace at the very start of the block is intercepted here. Enter (new paragraph
      // inside this block), Shift-Enter (hard break) and IME composition are all left to
      // TipTap/ProseMirror's own handling.
      handleKeyDown(_view, event) {
        // A2: plain Backspace at the very start of this block's content -- the first inner
        // paragraph's first position, collapsed. Backspace at the start of any *later* inner
        // paragraph is not intercepted: ProseMirror joins it into the paragraph above, inside this
        // same block, and no Content Studio blocks are merged.
        if (
          event.key === "Backspace" && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey
          && !event.isComposing
        ) {
          const backspaceHandler = onBackspaceAtStartRef.current;
          if (!backspaceHandler) return false;
          // `editor` is typed Editor | null because of immediatelyRender: false -- this handler only
          // runs for a real keydown on a live EditorView, which can't exist before `editor` does,
          // but TypeScript can't prove that; bailing to the default behavior is a safe last resort.
          if (!editor) return false;

          const { from, to, $from } = editor.state.selection;
          // Collapsed selection, at offset 0 of its parent, and that parent is the doc's first child.
          const atStart = from === to && $from.parentOffset === 0 && $from.index(0) === 0;
          if (!atStart) return false;

          // This handler only ever reports state -- it never deletes/merges anything itself. The
          // actual block-array decision (delete vs. merge, and into what) is ContentStudio's.
          backspaceHandler({ isEmpty: editor.isEmpty, doc: editor.state.doc.toJSON() as TipTapDocument });
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      lastEmittedRef.current = json;
      onChange(json);
    },
    onSelectionUpdate: ({ editor }) => {
      setSelectionCollapsed(editor.state.selection.empty);
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

  // `immediatelyRender: false` means the editor instance doesn't exist on the very first render
  // (it mounts asynchronously to avoid the Next.js SSR hydration mismatch noted above), so this
  // can't just focus inline during render -- it has to wait for `editor` to actually show up.
  // A newly split-off block (A1) renders with autoFocus true for exactly one render, cleared
  // right back to false by BlockCanvas once this fires and the resulting DOM focus event bubbles
  // up to it -- so this effect firing again later with editor unchanged and autoFocus still true
  // isn't a case that normally recurs, but re-focusing is harmless if it ever did.
  useEffect(() => {
    if (!editor || !autoFocus) return;
    editor.commands.focus(autoFocus === "end" ? "end" : "start");
  }, [editor, autoFocus]);

  // A2: applies a pending merge -- content from a block that's about to be deleted, appended onto
  // this editor's own content, with the cursor left exactly at the join point.
  //
  // Why this happens here, inside the *target* block's own live editor, instead of ContentStudio
  // splicing the two blocks' JSON together and telling this block "here's your new content, start
  // at position N": ContentStudio has no live ProseMirror state to resolve "position N" against
  // safely -- computing where the join point lands in the merged doc from raw JSON alone is
  // exactly the class of off-by-one mistake this file's own Enter-splitting logic already had to
  // get right using real ProseMirror positions (see A1-fix). This editor already has a live
  // EditorState; asking it to do the splice means the join position is just "where the cursor
  // already is right before the insert", not a number computed by hand.
  useEffect(() => {
    if (!editor || !pendingMerge) return;

    // The end of this block's content *before* the merge is the join point -- captured now,
    // before anything is inserted, since insertion happens at (not before) this position and so
    // doesn't shift it.
    const joinPos = editor.state.doc.content.size - 1;

    // The incoming doc's first paragraph's inline content (text/marks/hardBreaks) joins directly
    // onto this block's last paragraph; every further inner paragraph of the incoming block is
    // appended after it as its own paragraph node, in order -- nothing is discarded.
    const nodes = pendingMerge.content ?? [];
    const firstInline = nodes[0]?.content ?? [];
    const rest = nodes.slice(1);

    editor
      .chain()
      .focus("end")
      .insertContent([...firstInline, ...rest])
      // setTextSelection clamps its position to the transaction's own valid range internally
      // (@tiptap/core's command implementation), so an out-of-range joinPos degrades to the
      // nearest valid position instead of throwing -- not something this call needs to check
      // itself first.
      .setTextSelection(joinPos)
      .run();

    // The insert above already ran onUpdate -> onChange with the merged content, same as any
    // other edit -- that's correct and required (this block's text really did change), not
    // something to suppress. onMergeApplied only clears the *request*, not the content change.
    //
    // Read through a ref, not the `onMergeApplied` prop directly -- deliberately kept out of this
    // effect's own dependency array (same reasoning as onEnterRef/onBackspaceAtStartRef/
    // onPasteBlocksRef above): re-running this effect on every render where a new inline
    // onMergeApplied identity happens to be passed would risk re-applying the merge, when what
    // should actually re-trigger it is only `pendingMerge` itself changing.
    onMergeAppliedRef.current?.();
  }, [editor, pendingMerge]);

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

  // "Tách khối tại con trỏ": cuts this block's doc at the cursor (only offered for a collapsed
  // selection) and hands both halves to the block layer, which keeps `before` here and puts
  // `after` in a new paragraph block right below. A cut exactly at a paragraph boundary leaves an
  // empty paragraph at the cut edge of one half -- trimmed, so neither block starts or ends with a
  // stray blank line.
  function handleSplitAtCursor() {
    if (!editor || !onSplitAtCursor) return;
    const { selection, doc } = editor.state;
    if (!selection.empty) return;
    const pos = selection.from;
    onSplitAtCursor({
      before: trimEdgeEmptyParagraph(doc.cut(0, pos).toJSON() as TipTapDocument, "end"),
      after: trimEdgeEmptyParagraph(doc.cut(pos, doc.content.size).toJSON() as TipTapDocument, "start"),
    });
  }

  const isEmpty = !editor || editor.isEmpty;
  const linkActive = editor?.isActive("link") ?? false;

  return (
    <div>
      <div
        className="mb-1.5 flex flex-wrap items-center gap-1 rounded-lg p-1"
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
        {onSplitAtCursor && (
          <div className="ml-auto flex items-center gap-2">
            {!selectionCollapsed && (
              <span id={`${id}-split-hint`} className="text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>
                Bỏ chọn văn bản để tách khối
              </span>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSplitAtCursor}
              disabled={!editor || !selectionCollapsed}
              aria-describedby={!selectionCollapsed ? `${id}-split-hint` : undefined}
              title={selectionCollapsed
                ? "Phần sau con trỏ chuyển sang một khối Đoạn văn mới ngay bên dưới"
                : "Bỏ chọn văn bản, đặt con trỏ tại vị trí cần tách"}
              className="admin-focus-ring flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
              style={{ color: "var(--admin-text-muted)", border: "1px solid var(--admin-border)" }}
            >
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              Tách khối tại con trỏ
            </button>
          </div>
        )}
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
