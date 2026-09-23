"use client";

import { useCallback, useState } from "react";
import { createBlock, parseBlocksJson } from "@/types/contentBlocks";
import type { ContentBlock, ContentBlockType } from "@/types/contentBlocks";

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
  /** The id of the block that should receive focus on its next render, or null when nothing is
   * pending. This is focus *intent*, not "which block currently has focus" (that stays local UI
   * state in BlockEditor, as it always has) -- it exists so that an action which both mutates
   * `blocks` and needs to move focus (A1's Enter-to-split) can express both through the same
   * state owner, per the "ContentStudio/useContentEditor is the only state owner" rule, instead
   * of reaching into a sibling component's local state. */
  pendingFocusBlockId: string | null;
  /** Sets (or clears, with null) which block should auto-focus next. The block that actually
   * receives that focus is expected to clear it back to null once it does (BlockCanvas does this
   * via the same onFocus signal it already had), so a stale request never re-fires on a later,
   * unrelated render. */
  requestFocus: (blockId: string | null) => void;
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
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);

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
    // A focus request from whatever document was open before (if any) has nothing to do with
    // this newly-loaded one -- stale intent, so it's cleared the same way dirty is.
    setPendingFocusBlockId(null);
    return result.error;
  }, []);

  const serializeBlocks = useCallback(() => JSON.stringify(blocks), [blocks]);

  const markDirty = useCallback(() => setDirty(true), []);
  const clearDirty = useCallback(() => setDirty(false), []);
  // Pure focus intent, not a content change -- deliberately does not call markDirty(). Nothing
  // about which block is about to be focused is part of the document being saved.
  const requestFocus = useCallback((blockId: string | null) => setPendingFocusBlockId(blockId), []);

  return {
    blocks, dirty, addBlock, addBlockAt, insertBlockAt, updateBlock, removeBlock, moveBlock,
    pendingFocusBlockId, requestFocus, loadBlocks, serializeBlocks, markDirty, clearDirty,
  };
}
