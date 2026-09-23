"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import { Bold, Highlighter, Italic, Link as LinkIcon, Unlink, X } from "lucide-react";
import { isSafeHref } from "@/lib/richText";
import { isTipTapDocEmpty, type TipTapDocument } from "@/lib/tiptapContent";
import { richTextExtensions } from "@/lib/richTextExtensions";
import { clipboardToBlocks } from "@/lib/pasteToBlocks";
import type { ContentBlock } from "@/types/contentBlocks";

/**
 * What Enter hands back to the block layer when it's asked to split a paragraph (A1, reversing
 * the earlier SingleParagraphEnter decision). `before`/`after` are cut from the live ProseMirror
 * doc via `Node.cut()`, not by slicing text, so every mark spanning the split point (bold,
 * italic, link, highlight) survives on whichever side it ends up on.
 */
export interface ParagraphEnterPayload {
  /** Everything from the start of the doc up to the cursor -- stays in the current block. */
  before: TipTapDocument;
  /** Everything from the cursor to the end of the doc, or null when there's nothing there (the
   * cursor was at the very end) -- goes to a new block below, when there's anything to move. */
  after: TipTapDocument | null;
  /** True when the cursor was at the very start of the doc with nothing selected -- the caller
   * treats this as "add an empty block above", not a split. */
  atStart: boolean;
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

/**
 * What a multi-block paste (A3) hands back to the block layer. Unlike Enter/Backspace, this one
 * carries the converted `blocks` themselves (pasted content parsed into whatever mix of block
 * types the clipboard's structure implied -- headings, lists, quotes, more paragraphs), since
 * that conversion has to happen here, against the live clipboard event, not something ContentStudio
 * could derive on its own. `before`/`after` are the same cut-at-cursor split A1's Enter already
 * does (marks preserved via `Node.cut()`, selected range excluded from both sides).
 */
export type ParagraphPastePayload = {
  before: TipTapDocument;
  /** Whether `before` has any visible content -- included rather than left for the caller to
   * derive, same reasoning as ParagraphBackspacePayload.isEmpty: it's a judgment this component
   * already has to make internally (to decide whether to intervene in the paste at all), so
   * there's no reason to make the caller re-derive it from raw JSON. */
  beforeIsEmpty: boolean;
  after: TipTapDocument | null;
  blocks: ContentBlock[];
};

interface RichTextInputProps {
  id: string;
  value: string | TipTapDocument;
  onChange: (value: TipTapDocument) => void;
  placeholder?: string;
  align?: "left" | "center" | "right";
  /** Handles a plain Enter keypress by splitting this paragraph into two, instead of the default
   * hard-break-in-place behavior. Optional and only meaningful for ParagraphBlock -- when omitted,
   * Enter falls back to inserting a hard break (the old SingleParagraphEnter behavior), so any
   * future caller that doesn't wire this still gets a safe default instead of TipTap's raw
   * splitBlock. Shift-Enter always inserts a hard break regardless, via HardBreak's own default
   * shortcut -- this only ever intercepts plain Enter. */
  onEnter?: (payload: ParagraphEnterPayload) => void;
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
  /** A3: handles a paste whose clipboard content converts to more than one block, or to a single
   * non-paragraph block (a list, a heading, ...) -- reports the converted blocks plus the doc
   * split at the cursor (same shape as onEnter), and lets the block layer decide how to splice
   * them into the array. When the clipboard converts to exactly one plain paragraph, this isn't
   * called at all -- see handlePaste below, that case is left to TipTap's own default paste so a
   * "paste a phrase mid-sentence" interaction is never changed by this. Optional, same "safe
   * no-op when absent" contract as onEnter/onBackspaceAtStart. */
  onPasteBlocks?: (payload: ParagraphPastePayload) => void;
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
 * execCommand implementation (RichTextEditor.tsx, removed Phase 2.3.1). Controlled the same way
 * every other block editor is: `value` in, `onChange` out, no state owned beyond what TipTap
 * itself needs to run its own editor instance, plus the small amount of local UI state the Link
 * popover needs.
 *
 * Also owns three block-boundary behaviors that report intent upward rather than acting on the
 * block array themselves (this component has no concept of "the block array" at all): Enter (A1,
 * split into a new block), Backspace at the start of the content (A2, delete or merge into the
 * previous block), and a multi-block paste (A3, split the clipboard's content into several
 * blocks). See the `onEnter`/`onBackspaceAtStart` handlers in handleKeyDown and `onPasteBlocks` in
 * handlePaste below, and the `pendingMerge` effect for A2's merge case specifically.
 *
 * Scope is deliberately narrow -- Bold, Italic, Link, Highlight only. Every other StarterKit node
 * (headings, lists, blockquote, code block, horizontal rule, strike, underline) is turned off in
 * the extension config below, which does double duty as the paste sanitizer: ProseMirror's HTML
 * paste parser only ever produces node/mark types this editor's schema actually registers, so a
 * paste from Word/Docs/a web page loses font styles, colors, and any structure outside this list
 * for free, without a separate cleanup pass -- there is no schema slot for them to land in.
 *
 * Enter (A1): a plain Enter no longer inserts a hard break in place -- it calls `onEnter` with the
 * doc split at the cursor (marks preserved via ProseMirror's `Node.cut`, not string slicing) and
 * lets the block layer (BlockCanvas/ContentStudio) decide what that means for the block array.
 * This reverses Phase 2.3.1's SingleParagraphEnter decision, which forced one ParagraphBlock to
 * stay one paragraph forever and made writing anything longer than a couple of paragraphs mean
 * repeatedly reaching for the mouse. Shift-Enter is untouched -- still a hard break, via
 * HardBreak's own default shortcut, since this only intercepts plain Enter. When `onEnter` isn't
 * supplied, plain Enter falls back to the old hard-break behavior instead of TipTap's raw
 * splitBlock, so any caller that doesn't wire A1's split logic still gets a safe, contained
 * default rather than a silently-appearing second paragraph node inside one block's own doc.
 *
 * The Enter interception lives in `editorProps.handleKeyDown`, not a keyboard-shortcut Extension
 * -- an Extension is `.create()`d once at module scope (as SingleParagraphEnter itself was) and
 * would close over whatever `onEnter` happened to be in scope at that point, not this specific
 * render's prop. `handleKeyDown` is a plain function recreated with the editor's config on every
 * relevant change, but even that isn't reactive to a prop changing without recreating the whole
 * editor instance -- so the handler always reads the *latest* onEnter through `onEnterRef` rather
 * than closing over the prop value directly.
 */
export default function RichTextInput({
  id, value, onChange, placeholder, align = "left",
  onEnter, onBackspaceAtStart, autoFocus, pendingMerge, onMergeApplied, onPasteBlocks,
}: RichTextInputProps) {
  const lastEmittedRef = useRef<string | TipTapDocument>(value);
  const onEnterRef = useRef(onEnter);
  const onBackspaceAtStartRef = useRef(onBackspaceAtStart);
  const onPasteBlocksRef = useRef(onPasteBlocks);
  const onMergeAppliedRef = useRef(onMergeApplied);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    onBackspaceAtStartRef.current = onBackspaceAtStart;
  }, [onBackspaceAtStart]);

  useEffect(() => {
    onPasteBlocksRef.current = onPasteBlocks;
  }, [onPasteBlocks]);

  useEffect(() => {
    onMergeAppliedRef.current = onMergeApplied;
  }, [onMergeApplied]);

  const editor = useEditor({
    // Next.js renders once on the server for the initial HTML; TipTap's own guidance for SSR
    // frameworks is to disable that first render and let the client mount the editor, avoiding a
    // hydration mismatch (the editor's internal ids differ between the two passes otherwise).
    immediatelyRender: false,
    content: resolveInitialContent(value),
    // Phase A3: moved to lib/richTextExtensions.ts so lib/pasteToBlocks.ts's clipboard-to-blocks
    // conversion parses pasted HTML through this exact same configured array (via generateJSON),
    // not a second, separately-maintained copy -- see that file's own header comment.
    extensions: richTextExtensions,
    editorProps: {
      attributes: {
        id,
        class: "admin-input min-h-[84px]",
        role: "textbox",
        "aria-multiline": "true",
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
      },
      // Plain Enter only -- Shift-Enter/Mod-Enter etc. fall through to TipTap's own handling
      // (HardBreak's default shortcut covers Shift-Enter). Returning true tells ProseMirror this
      // key was fully handled, so its own default Enter behavior (splitBlock) never runs.
      handleKeyDown(view, event) {
        // A2: plain Backspace at the very start of this block's content. Kept as its own early
        // branch, entirely separate from the Enter logic below it -- different key, different
        // payload shape, nothing shared beyond both living in this same handleKeyDown callback.
        if (
          event.key === "Backspace" && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey
          && !event.isComposing
        ) {
          const backspaceHandler = onBackspaceAtStartRef.current;
          if (!backspaceHandler) return false;
          if (!editor) return false; // see the identical guard below for why this can't be proven statically

          const { from, to, $from } = editor.state.selection;
          // Same atStart resolution A1 uses for Enter: collapsed selection, at offset 0 of its
          // parent, and that parent is the doc's first child.
          const atStart = from === to && $from.parentOffset === 0 && $from.index(0) === 0;
          if (!atStart) return false;

          // This handler only ever reports state -- it never deletes/merges anything itself. The
          // actual block-array decision (delete vs. merge, and into what) is ContentStudio's,
          // same division of responsibility as onEnter.
          backspaceHandler({ isEmpty: editor.isEmpty, doc: editor.state.doc.toJSON() as TipTapDocument });
          return true;
        }

        if (event.key !== "Enter" || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
          return false;
        }
        // Mid-IME-composition Enter (confirming a candidate, common with Vietnamese input
        // methods) is not "the user wants a new paragraph" -- let the browser/IME handle it.
        if (event.isComposing) return false;

        const handler = onEnterRef.current;
        if (!handler) {
          // No split behavior wired -- safe fallback is the old hard-break-in-place, not TipTap's
          // raw splitBlock (which would silently let one ParagraphBlock's own doc grow a second
          // paragraph node, the exact thing SingleParagraphEnter existed to prevent). Dispatched
          // directly against `view` rather than via `editor.commands` -- `view` is handleKeyDown's
          // own parameter, unambiguously safe to use regardless of where in this function it's
          // referenced (unlike `editor`, the closured outer variable used below once we know a
          // handler exists and the codepath is no longer reachable before `editor` is assigned).
          const hardBreakType = view.state.schema.nodes.hardBreak;
          if (hardBreakType) {
            view.dispatch(view.state.tr.replaceSelectionWith(hardBreakType.create()).scrollIntoView());
          }
          return true;
        }

        // `editor` (the React-side wrapper) is typed Editor | null because of
        // immediatelyRender: false -- in practice this handler only ever runs in response to a
        // real keydown against a live EditorView, which can't exist before `editor` does, but
        // TypeScript can't prove that here. Bailing to the browser's default Enter behavior in
        // the theoretical null case is a safe last resort, not a real code path.
        if (!editor) return false;

        // A1-fix: replaces the original calculation, which had two bugs.
        //   N1 -- atStart was checked as `pos === 0`. Position 0 in ProseMirror is *before* the
        //   first block node, not the start of its text content (the first real cursor position
        //   inside a paragraph is 1), so that check was never true and every Enter fell into the
        //   split branch below, including at the very start of a paragraph (L1, and L3 as its
        //   repeated-Enter consequence). Fixed by resolving position, not comparing a raw number:
        //   collapsed selection + at offset 0 of its parent + that parent is the doc's first child.
        //   N2 -- `after` was cut starting at `selection.from`, which still includes a
        //   non-collapsed selection's own text, so a selected range survived into `after` instead
        //   of disappearing (L2). Fixed by cutting `before` up to `from` and `after` from `to` --
        //   whatever sits between `from` and `to` (the selected range) is cut out of the document
        //   entirely, on both sides.
        const { state } = editor;
        const { from, to, $from } = state.selection;
        const docSize = state.doc.content.size;

        // (1) A fully empty paragraph is treated like "at the end" (open an empty block below,
        // move focus there), not "at the start" -- even though the cursor is trivially at the
        // start of empty content too. Letting atStart win here would mean pressing Enter
        // repeatedly on an empty block never visibly does anything (focus never moves), which
        // reads as a broken key rather than "add another empty paragraph."
        if (editor.isEmpty) {
          handler({ before: state.doc.toJSON() as TipTapDocument, after: null, atStart: false });
          return true;
        }

        // (2) Cursor collapsed at the very start of the first block's own content.
        const atStart = from === to && $from.parentOffset === 0 && $from.index(0) === 0;
        if (atStart) {
          handler({ before: state.doc.toJSON() as TipTapDocument, after: null, atStart: true });
          return true;
        }

        // (3) Split. Node.cut() operates on the actual node/fragment tree, not serialized text,
        // so every mark spanning the cut point (bold, italic, link, highlight) survives on
        // whichever side it ends up on -- a text-slicing approach couldn't guarantee that.
        const beforeDoc = state.doc.cut(0, from);
        const afterDoc = state.doc.cut(to, docSize);
        const afterIsEmpty = afterDoc.textContent.length === 0;

        handler({
          before: beforeDoc.toJSON() as TipTapDocument,
          after: afterIsEmpty ? null : (afterDoc.toJSON() as TipTapDocument),
          atStart: false,
        });
        return true;
      },
      // A3: a paste whose clipboard content converts to more than one block (or to a single
      // non-paragraph block) is handed up to the block layer instead of landing inside this one
      // block's doc as several TipTap paragraph nodes. A paste that converts to exactly one plain
      // paragraph is deliberately left alone -- returning false here means TipTap's own default
      // paste handling runs unchanged, so "paste a phrase into the middle of a sentence" is never
      // affected by any of this.
      handlePaste(view, event) {
        const pasteHandler = onPasteBlocksRef.current;
        if (!pasteHandler) return false;
        if (!editor) return false; // same unprovable-statically null guard as the Enter/Backspace branches above

        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const html = clipboardData.getData("text/html");
        const text = clipboardData.getData("text/plain");
        if (!html && !text) return false; // nothing this code can read -- let TipTap try its own handling

        const blocks = clipboardToBlocks(html || null, text || null);

        // Nothing usable came out of the conversion (e.g. clipboard content that was only
        // images/comments/style tags) -- rather than silently eating the paste, fall through to
        // TipTap's own default handling, which may still be able to do something with it.
        if (blocks.length === 0) return false;

        // Exactly one plain paragraph -- the common case (copying a word or a sentence from
        // somewhere) must not change behavior at all.
        if (blocks.length === 1 && blocks[0].type === "paragraph") return false;

        const { state } = editor;
        const { from, to } = state.selection;
        const docSize = state.doc.content.size;
        // Same cut-at-cursor split A1's Enter uses -- before ends at `from`, after starts at
        // `to`, so a currently-selected range is excluded from both sides rather than surviving
        // into one of them.
        const beforeDoc = state.doc.cut(0, from);
        const afterDoc = state.doc.cut(to, docSize);
        const beforeJson = beforeDoc.toJSON() as TipTapDocument;
        const afterIsEmpty = afterDoc.textContent.length === 0;

        pasteHandler({
          before: beforeJson,
          beforeIsEmpty: isTipTapDocEmpty(beforeJson),
          after: afterIsEmpty ? null : (afterDoc.toJSON() as TipTapDocument),
          blocks,
        });
        return true;
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
    // onto this block's last line; any further paragraph nodes after that (only possible via the
    // documented multi-paragraph-paste edge case, not through normal typing) are appended as
    // their own nodes rather than discarded.
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
