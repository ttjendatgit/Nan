"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  AlignLeft,
  ImageIcon,
  Eye,
} from "lucide-react";
import { uploadMedia } from "@/lib/api/media";
import { updateProductContent } from "@/lib/api/products";
import ContentBlocksRenderer from "./ContentBlocksRenderer";
import type {
  ContentBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  Product,
} from "@/types/catalog";

// -- Props --------------------------------------------------------------------

interface ContentBlockEditorProps {
  productId: string;
  initialBlocks?: ContentBlock[];
  token: string;
  onSaved?: (product: Product) => void;
}

// -- Styles (reused across cards) ---------------------------------------------

const INPUT_CLS =
  "w-full rounded-lg bg-[#1B1C4A] border border-[#273481] text-white placeholder-[#B6D6F2]/30 px-3 py-2 text-sm outline-none focus:border-[#B6D6F2] transition-colors";

const ICON_BTN =
  "rounded-lg p-1.5 text-[#B6D6F2]/60 hover:text-white hover:bg-[#273481]/40 transition-colors disabled:opacity-30 disabled:pointer-events-none";

const TYPE_BADGE =
  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider";

// -- Component ----------------------------------------------------------------

export default function ContentBlockEditor({
  productId,
  initialBlocks,
  token,
  onSaved,
}: ContentBlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const imgInputRef = useRef<HTMLInputElement>(null);

  // Sync when productId or initialBlocks changes
  useEffect(() => {
    setBlocks(initialBlocks ?? []);
    setMessage(null);
  }, [productId, initialBlocks]);

  // -- Block mutations --------------------------------------------------------

  function updateBlock(index: number, updated: ContentBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addHeading() {
    setBlocks((prev) => [
      ...prev,
      { type: "heading", level: 2, text: "" } as HeadingBlock,
    ]);
  }

  function addParagraph() {
    setBlocks((prev) => [
      ...prev,
      { type: "paragraph", text: "" } as ParagraphBlock,
    ]);
  }

  function triggerImageUpload() {
    imgInputRef.current?.click();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    if (imgInputRef.current) imgInputRef.current.value = "";

    setUploading(true);
    setMessage(null);
    try {
      const result = await uploadMedia(file, "products", token);
      const newBlock: ImageBlock = {
        type: "image",
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        alt: "",
        caption: "",
      };
      setBlocks((prev) => [...prev, newBlock]);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Upload thất bại",
      });
    } finally {
      setUploading(false);
    }
  }

  // -- Save -------------------------------------------------------------------

  async function handleSave() {
    if (!productId) return;

    // Clean blocks: trim all text fields, strip blanks, normalize image fields
    const cleaned: ContentBlock[] = [];
    for (const block of blocks) {
      if (block.type === "heading") {
        const text = block.text.trim();
        if (text.length === 0) continue;
        cleaned.push({ type: "heading", level: block.level, text });
      } else if (block.type === "paragraph") {
        const text = block.text.trim();
        if (text.length === 0) continue;
        cleaned.push({ type: "paragraph", text });
      } else if (block.type === "image") {
        const secureUrl = block.secureUrl.trim();
        if (secureUrl.length === 0) continue;
        const publicId = (block.publicId ?? "").trim();
        const alt = block.alt.trim();
        const caption = (block.caption ?? "").trim();
        cleaned.push({
          type: "image",
          secureUrl,
          publicId,
          alt,
          ...(caption.length > 0 ? { caption } : {}),
        });
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProductContent(productId, cleaned, token);
      setBlocks(updated.contentBlocks ?? cleaned);
      setMessage({ type: "success", text: "Đã lưu nội dung thành công." });
      onSaved?.(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Lưu thất bại",
      });
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploading;

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Block list */}
      {blocks.length === 0 && (
        <p className="text-xs text-[#B6D6F2]/30 py-3 text-center">
          Chưa có nội dung. Thêm block phía dưới.
        </p>
      )}

      <div className="space-y-2.5">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#1B1C4A] bg-[#0D131F] p-3.5 space-y-2.5"
          >
            {/* Card header */}
            <div className="flex items-center gap-2">
              {/* Type badge */}
              {block.type === "heading" && (
                <span
                  className={`${TYPE_BADGE} bg-[#273481]/30 text-[#B6D6F2]/70`}
                >
                  Tiêu đề
                </span>
              )}
              {block.type === "paragraph" && (
                <span
                  className={`${TYPE_BADGE} bg-[#1B1C4A] text-[#B6D6F2]/50`}
                >
                  Đoạn văn
                </span>
              )}
              {block.type === "image" && (
                <span
                  className={`${TYPE_BADGE} bg-green-900/30 text-green-400/70`}
                >
                  Ảnh
                </span>
              )}

              <div className="flex-1" />

              {/* Move / delete controls */}
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                title="Di chuyển lên"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={ICON_BTN}
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                title="Di chuyển xuống"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`${ICON_BTN} hover:text-red-400 hover:bg-red-900/20`}
                onClick={() => removeBlock(index)}
                title="Xóa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Block body */}
            {block.type === "heading" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={block.level}
                    onChange={(e) =>
                      updateBlock(index, {
                        ...block,
                        level: Number(e.target.value) as 2 | 3,
                      })
                    }
                    className="rounded-lg bg-[#1B1C4A] border border-[#273481] text-white text-xs px-2 py-1.5 outline-none focus:border-[#B6D6F2] transition-colors"
                  >
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <input
                    type="text"
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(index, { ...block, text: e.target.value })
                    }
                    placeholder="Nhập tiêu đề..."
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            )}

            {block.type === "paragraph" && (
              <textarea
                value={block.text}
                onChange={(e) =>
                  updateBlock(index, { ...block, text: e.target.value })
                }
                placeholder="Nhập nội dung đoạn văn..."
                rows={3}
                className={`${INPUT_CLS} resize-none`}
              />
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                {/* Image preview */}
                {block.secureUrl && (
                  <div className="relative aspect-video w-full max-w-[240px] overflow-hidden rounded-lg border border-[#1B1C4A] bg-[#0A0B24]">
                    <Image
                      src={block.secureUrl}
                      alt={block.alt || "Preview"}
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={block.alt}
                  onChange={(e) =>
                    updateBlock(index, { ...block, alt: e.target.value })
                  }
                  placeholder="Mô tả ảnh (alt)..."
                  className={INPUT_CLS}
                />
                <input
                  type="text"
                  value={block.caption ?? ""}
                  onChange={(e) =>
                    updateBlock(index, { ...block, caption: e.target.value })
                  }
                  placeholder="Chú thích (caption)..."
                  className={INPUT_CLS}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={addHeading}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] bg-[#111335] px-3 py-2 text-xs text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white transition-all disabled:opacity-40"
        >
          <Type className="h-3.5 w-3.5" />
          Thêm tiêu đề
        </button>
        <button
          type="button"
          onClick={addParagraph}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] bg-[#111335] px-3 py-2 text-xs text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white transition-all disabled:opacity-40"
        >
          <AlignLeft className="h-3.5 w-3.5" />
          Thêm đoạn văn
        </button>
        <button
          type="button"
          onClick={triggerImageUpload}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] bg-[#111335] px-3 py-2 text-xs text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white transition-all disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          {uploading ? "Đang tải..." : "Thêm ảnh"}
        </button>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleImageFile}
        />
      </div>

      {/* Message */}
      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            message.type === "success"
              ? "text-green-400 bg-green-900/20"
              : "text-red-400 bg-red-900/20"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3">
        {productId && (
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-[#273481] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu nội dung
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-2 text-xs text-[#B6D6F2]/60 hover:border-[#273481] hover:text-white transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          {showPreview ? "Ẩn xem trước" : "Xem trước"}
        </button>
      </div>

      {/* Live preview */}
      {showPreview && (
        <div className="rounded-xl border border-[#1B1C4A] bg-[#111335]/50 p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#B6D6F2]/35 mb-4">
            Xem trước
          </p>
          {blocks.length > 0 ? (
            <ContentBlocksRenderer blocks={blocks} />
          ) : (
            <p className="text-xs text-[#B6D6F2]/25">
              Chưa có nội dung để xem trước.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
