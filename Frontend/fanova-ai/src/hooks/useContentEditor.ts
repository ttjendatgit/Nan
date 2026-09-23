"use client";

import { useCallback, useState } from "react";
import { createBlock, parseBlocksJson } from "@/types/contentBlocks";
import type { ContentBlock, ContentBlockType } from "@/types/contentBlocks";
import type { TipTapDocument } from "@/lib/tiptapContent";

export interface UseContentEditorResult {
  blocks: ContentBlock[];
  /** True once blocks have changed since the last loadBlocks()/clearDirty() call. ContentStudio
   * also calls markDirty() itself when the title field changes, since "dirty" covers the whole
   * document, not just the block array. */
  dirty: boolean;
  addBlock: (type: ContentBlockType) => ContentBlock;
  /** Like addBlock, but inserts at a specific position instead of always appending -- what
   * pressing Enter inside a ParagraphBlock uses (A1) to open a new empty paragraph right where
   * the cursor is, rather than at the end of the document. Returns the new block's id (not the
   * whole block, unlike addBlock) since callers of this one only ever need the id, to focus it. */
  addBlockAt: (type: ContentBlockType, index: number) => string;
  /** Inserts an already-built block (e.g. one carrying text split out of another block) at a
   * specific position. addBlockAt is addBlock's positional counterpart; this is insertBlockAt's
   * counterpart for when the caller has already constructed the block's content itself (A1's
   * "split mid-paragraph" case builds a ParagraphBlock with the split-off text before inserting
   * it, so createBlock's always-empty factory doesn't fit). */
  insertBlockAt: (block: ContentBlock, index: number) => void;
  updateBlock: (block: ContentBlock) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: -1 | 1) => void;
  /** The block that should receive focus on its next render, and which end of its content --
   * "start" (A1's Enter-to-split, the default) or "end" (A2's Backspace-to-merge, landing back on
   * the block that just absorbed another one's content). Null when nothing is pending. This is
   * focus *intent*, not "which block currently has focus" (that stays local UI state in
   * BlockEditor, as it always has) -- it exists so that an action which both mutates `blocks` and
   * needs to move focus can express both through the same state owner, per the
   * "ContentStudio/useContentEditor is the only state owner" rule, instead of reaching into a
   * sibling component's local state. */
  pendingFocus: { blockId: string; position: "start" | "end" } | null;
  /** Sets (or clears, with null) which block should auto-focus next, and where. `position`
   * defaults to "start" so every existing A1 call site (which never passed a third argument)
   * keeps behaving exactly as before. The block that actually receives that focus is expected to
   * clear this back to null once it does (BlockCanvas does this via the same onFocus signal it
   * already had), so a stale request never re-fires on a later, unrelated render. */
  requestFocus: (blockId: string | null, position?: "start" | "end") => void;
  /** A2: a merge in progress -- `incoming` is the full doc of a ParagraphBlock that's being
   * deleted, to be appended onto the end of the block identified by `blockId` (the one immediately
   * before it). Null when no merge is pending. See RichTextInput.tsx for why the actual splice
   * happens inside that target block's own live TipTap editor instead of as a JSON operation at
   * this layer. */
  pendingMerge: { blockId: string; incoming: TipTapDocument } | null;
  requestMerge: (blockId: string, incoming: TipTapDocument) => void;
  /** Called once the target block's RichTextInput has applied a pending merge, so it isn't
   * reapplied on some later, unrelated render -- the same "clear once consumed" contract
   * pendingFocus already has, just without a DOM-focus-event trigger to hang it off of (a merge
   * has no equivalent "it landed" signal from the browser the way focus does), so the consumer
   * calls this explicitly right after the splice. */
  clearMerge: () => void;
  /** Replaces the current blocks with the result of parsing `json`, and resets dirty to false
   * (this is a load, not an edit). Returns a warning string if parsing degraded in any way
   * (invalid JSON, wrong shape, unrecognized items skipped) so the caller can surface it --
   * never throws. */
  loadBlocks: (json: string | null | undefined) => string | null;
  serializeBlocks: () => string;
  markDirty: () => void;
  clearDirty: () => void;
}

/**
 * Owns the block-editing state machine: the blocks array itself, every mutation
 * (add/update/remove/reorder), loading from a persisted JSON string, serializing back to one,
 * and dirty tracking. This is the "business logic" ContentStudio used to hold directly -- pulling
 * it out here means ContentStudio's own code is just orchestration (title, save/publish, routing,
 * dirty-aware navigation), not editor mechanics.
 *
 * Deliberately does NOT own `activeBlockId` (which block currently reads as "focused" in the
 * canvas) -- that is pure UI presentation state with no meaning to anything outside BlockEditor,
 * so it stays local to BlockEditor instead of leaking into this hook's surface.
 */
export function useContentEditor(initialBlocks: ContentBlock[] = []): UseContentEditorResult {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [dirty, setDirty] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<{ blockId: string; position: "start" | "end" } | null>(null);
  const [pendingMerge, setPendingMerge] = useState<{ blockId: string; incoming: TipTapDocument } | null>(null);

  // A1-fix-2: every mutation below uses the functional setBlocks(prev => ...) form, reading the
  // latest array from `prev` rather than closing over the `blocks` variable. React batches state
  // updates within one event, so a handler that fires two mutations back to back (exactly what
  // Enter-to-split does: updateBlock(text=before) immediately followed by insertBlockAt(splitBlock))
  // would otherwise have its second setBlocks(...) overwrite the first's result -- both calls
  // would compute their "next array" from the same pre-update `blocks` closure, and whichever
  // setBlocks ran last would win, silently discarding the other. Reading from `prev` instead means
  // each updater sees whatever the previous one in the same batch already produced. This matters
  // for more than just Enter -- the same "several mutations, one event" shape is exactly what a
  // future Backspace-merge or multi-block paste would need too.

  const addBlock = useCallback((type: ContentBlockType) => {
    // Built outside the updater since the caller needs the block itself back, and createBlock()
    // doesn't depend on the current array anyway (a fresh id/empty content either way).
    const newBlock = createBlock(type);
    setBlocks((prev) => [...prev, newBlock]);
    setDirty(true);
    return newBlock;
  }, []);

  const addBlockAt = useCallback((type: ContentBlockType, index: number) => {
    const newBlock = createBlock(type);
    setBlocks((prev) => {
      const clampedIndex = Math.max(0, Math.min(index, prev.length));
      const next = [...prev];
      next.splice(clampedIndex, 0, newBlock);
      return next;
    });
    setDirty(true);
    return newBlock.id;
  }, []);

  const insertBlockAt = useCallback((block: ContentBlock, index: number) => {
    setBlocks((prev) => {
      const clampedIndex = Math.max(0, Math.min(index, prev.length));
      const next = [...prev];
      next.splice(clampedIndex, 0, block);
      return next;
    });
    setDirty(true);
  }, []);

  const updateBlock = useCallback((updated: ContentBlock) => {
    setBlocks((prev) => prev.map((block) => (block.id === updated.id ? updated : block)));
    setDirty(true);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setDirty(true);
  }, []);

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setDirty(true);
  }, []);

  const loadBlocks = useCallback((json: string | null | undefined) => {
    const result = parseBlocksJson(json);
    setBlocks(result.blocks);
    setDirty(false);
    // A focus/merge request from whatever document was open before (if any) has nothing to do
    // with this newly-loaded one -- stale intent, so both are cleared the same way dirty is.
    setPendingFocus(null);
    setPendingMerge(null);
    return result.error;
  }, []);

  const serializeBlocks = useCallback(() => JSON.stringify(blocks), [blocks]);

  const markDirty = useCallback(() => setDirty(true), []);
  const clearDirty = useCallback(() => setDirty(false), []);
  // Pure focus/merge intent, not a content change -- deliberately does not call markDirty().
  // Nothing about which block is about to be focused, or which merge is about to be applied, is
  // itself part of the document being saved (the merge's actual content change goes through
  // updateBlock/removeBlock, same as any other edit, and marks dirty there).
  const requestFocus = useCallback((blockId: string | null, position: "start" | "end" = "start") => {
    setPendingFocus(blockId ? { blockId, position } : null);
  }, []);
  const requestMerge = useCallback((blockId: string, incoming: TipTapDocument) => {
    setPendingMerge({ blockId, incoming });
  }, []);
  const clearMerge = useCallback(() => setPendingMerge(null), []);

  return {
    blocks, dirty, addBlock, addBlockAt, insertBlockAt, updateBlock, removeBlock, moveBlock,
    pendingFocus, requestFocus, pendingMerge, requestMerge, clearMerge,
    loadBlocks, serializeBlocks, markDirty, clearDirty,
  };
}
