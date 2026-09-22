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
  updateBlock: (block: ContentBlock) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: -1 | 1) => void;
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

  const addBlock = useCallback((type: ContentBlockType) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setDirty(true);
    return newBlock;
  }, [blocks]);

  const updateBlock = useCallback((updated: ContentBlock) => {
    setBlocks(blocks.map((block) => (block.id === updated.id ? updated : block)));
    setDirty(true);
  }, [blocks]);

  const removeBlock = useCallback((id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
    setDirty(true);
  }, [blocks]);

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= blocks.length) return;

    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setBlocks(next);
    setDirty(true);
  }, [blocks]);

  const loadBlocks = useCallback((json: string | null | undefined) => {
    const result = parseBlocksJson(json);
    setBlocks(result.blocks);
    setDirty(false);
    return result.error;
  }, []);

  const serializeBlocks = useCallback(() => JSON.stringify(blocks), [blocks]);

  const markDirty = useCallback(() => setDirty(true), []);
  const clearDirty = useCallback(() => setDirty(false), []);

  return { blocks, dirty, addBlock, updateBlock, removeBlock, moveBlock, loadBlocks, serializeBlocks, markDirty, clearDirty };
}
