"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  Pilcrow,
  List as ListIcon,
  Quote as QuoteIcon,
  ImageIcon,
  SeparatorHorizontal,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Plus,
  RefreshCw,
} from "lucide-react";
import { uploadMedia } from "@/lib/api/media";
import { updateProductContent } from "@/lib/api/products";
import ContentBlocksRenderer from "./ContentBlocksRenderer";
import type {
  ContentBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ListBlock,
  QuoteBlock,
  DividerBlock,
  BlockAlign,
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

const SELECT_CLS =
  "rounded-lg bg-[#1B1C4A] border border-[#273481] text-white text-xs px-2 py-1.5 outline-none focus:border-[#B6D6F2] transition-colors";

const ICON_BTN =
  "rounded-lg p-1.5 text-[#B6D6F2]/60 hover:text-white hover:bg-[#273481]/40 transition-colors disabled:opacity-30 disabled:pointer-events-none";

const TYPE_BADGE =
  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider";

const PRIMARY_BTN =
  "flex items-center justify-center gap-2 rounded-lg bg-[#273481] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity";

const SECONDARY_BTN =
  "flex items-center justify-center gap-2 rounded-lg border border-[#1B1C4A] px-4 py-2 text-sm text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white transition-all";

const ADD_BLOCK_BTN =
  "flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] bg-[#111335] px-3 py-2 text-xs text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white transition-all disabled:opacity-40";

// -- Style option tables (Vietnamese labels) -----------------------------------

const TONE_OPTIONS_FULL = [
  { value: "default", label: "Mặc định" },
  { value: "muted", label: "Dịu" },
  { value: "accent", label: "Xanh nhấn" },
  { value: "gold", label: "Vàng nhấn" },
] as const;

const TONE_OPTIONS_LIST = [
  { value: "default", label: "Mặc định" },
  { value: "accent", label: "Xanh nhấn" },
] as const;

const TONE_OPTIONS_QUOTE = [
  { value: "default", label: "Mặc định" },
  { value: "accent", label: "Xanh nhấn" },
  { value: "gold", label: "Vàng nhấn" },
] as const;

const WEIGHT_OPTIONS = [
  { value: "regular", label: "Thường" },
  { value: "medium", label: "Vừa" },
  { value: "semibold", label: "Đậm vừa" },
  { value: "bold", label: "Đậm" },
] as const;

const SIZE_OPTIONS = [
  { value: "sm", label: "Nhỏ" },
  { value: "base", label: "Vừa" },
  { value: "lg", label: "Lớn" },
] as const;

const LIST_STYLE_OPTIONS = [
  { value: "bullet", label: "Bullet" },
  { value: "number", label: "Số thứ tự" },
] as const;

// -- Small toolbar primitives ---------------------------------------------------

function AlignButtons({
  value,
  onChange,
}: {
  value?: BlockAlign;
  onChange: (v: BlockAlign) => void;
}) {
  const current = value ?? "left";
  const options = [
    { value: "left" as const, icon: AlignLeft, label: "Căn trái" },
    { value: "center" as const, icon: AlignCenter, label: "Căn giữa" },
    { value: "right" as const, icon: AlignRight, label: "Căn phải" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-[#1B1C4A] p-0.5">
      {options.map(({ value: v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          title={label}
          onClick={() => onChange(v)}
          className={`rounded-md p-1.5 transition-colors ${
            current === v
              ? "bg-[#273481] text-white"
              : "text-[#B6D6F2]/40 hover:text-white hover:bg-[#273481]/30"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function ItalicToggle({
  active,
  onToggle,
}: {
  active?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      title="In nghiêng"
      onClick={onToggle}
      className={`rounded-lg border p-1.5 transition-colors ${
        active
          ? "border-[#273481] bg-[#273481] text-white"
          : "border-[#1B1C4A] text-[#B6D6F2]/40 hover:text-white hover:bg-[#273481]/30"
      }`}
    >
      <Italic className="h-3.5 w-3.5" />
    </button>
  );
}

function StyleSelect({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value ?? options[0].value}
      onChange={(e) => onChange(e.target.value)}
      className={SELECT_CLS}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// -- Local modal primitive ------------------------------------------------------
// Minimal, dependency-free dialog: centered panel + backdrop, Escape to close,
// scroll lock while open, focus moved to the panel on open.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  maxWidthClassName?: string;
  children: React.ReactNode;
}

function Modal({
  open,
  onClose,
  labelledBy,
  maxWidthClassName = "max-w-md",
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/72 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative z-10 w-full ${maxWidthClassName} max-h-[85vh] overflow-y-auto rounded-2xl border border-[#1B1C4A] bg-[#0D131F] shadow-[0_24px_80px_rgba(0,0,0,0.85)] outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [uploadErrorOpen, setUploadErrorOpen] = useState(false);
  const [uploadErrorText, setUploadErrorText] = useState("");
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIndex = useRef<number | null>(null);

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

  function addList() {
    setBlocks((prev) => [
      ...prev,
      { type: "list", items: [""], style: "bullet" } as ListBlock,
    ]);
  }

  function addQuote() {
    setBlocks((prev) => [...prev, { type: "quote", text: "" } as QuoteBlock]);
  }

  function addDivider() {
    setBlocks((prev) => [...prev, { type: "divider" } as DividerBlock]);
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
      setMessage({
        type: "success",
        text: "Ảnh đã được thêm vào nội dung. Vui lòng bấm Lưu nội dung để cập nhật trang sản phẩm.",
      });
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : "Đã có lỗi xảy ra khi tải ảnh. Vui lòng thử lại.";
      setMessage({ type: "error", text });
      setUploadErrorText(text);
      setUploadErrorOpen(true);
    } finally {
      setUploading(false);
    }
  }

  function triggerReplaceImage(index: number) {
    replaceTargetIndex.current = index;
    replaceInputRef.current?.click();
  }

  async function handleReplaceImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const index = replaceTargetIndex.current;
    // Reset input so the same file can be re-selected
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!file || index === null) return;

    setReplacingIndex(index);
    setMessage(null);
    try {
      const result = await uploadMedia(file, "products", token);
      setBlocks((prev) =>
        prev.map((b, i) =>
          i === index && b.type === "image"
            ? { ...b, secureUrl: result.secureUrl, publicId: result.publicId }
            : b
        )
      );
      setMessage({
        type: "success",
        text: "Ảnh đã được thay thế. Vui lòng bấm Lưu nội dung để cập nhật trang sản phẩm.",
      });
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : "Đã có lỗi xảy ra khi tải ảnh. Vui lòng thử lại.";
      setMessage({ type: "error", text });
      setUploadErrorText(text);
      setUploadErrorOpen(true);
    } finally {
      setReplacingIndex(null);
      replaceTargetIndex.current = null;
    }
  }

  // -- List item helpers --------------------------------------------------------

  function updateListItem(index: number, itemIndex: number, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== index || b.type !== "list") return b;
        const items = [...b.items];
        items[itemIndex] = value;
        return { ...b, items };
      })
    );
  }

  function addListItem(index: number) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === index && b.type === "list" ? { ...b, items: [...b.items, ""] } : b
      )
    );
  }

  function removeListItem(index: number, itemIndex: number) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === index && b.type === "list"
          ? { ...b, items: b.items.filter((_, ii) => ii !== itemIndex) }
          : b
      )
    );
  }

  // -- Save -------------------------------------------------------------------

  function requestSave() {
    if (!productId || busy) return;
    setConfirmOpen(true);
  }

  async function performSave() {
    if (!productId) return;

    // Clean blocks: trim all text, strip blanks, normalize image/list fields
    const cleaned: ContentBlock[] = [];
    for (const block of blocks) {
      if (block.type === "heading") {
        const text = block.text.trim();
        if (text.length === 0) continue;
        cleaned.push({
          type: "heading",
          level: block.level,
          text,
          ...(block.align ? { align: block.align } : {}),
          ...(block.tone ? { tone: block.tone } : {}),
          ...(block.italic ? { italic: true } : {}),
        });
      } else if (block.type === "paragraph") {
        const text = block.text.trim();
        if (text.length === 0) continue;
        cleaned.push({
          type: "paragraph",
          text,
          ...(block.align ? { align: block.align } : {}),
          ...(block.tone ? { tone: block.tone } : {}),
          ...(block.weight ? { weight: block.weight } : {}),
          ...(block.size ? { size: block.size } : {}),
          ...(block.italic ? { italic: true } : {}),
        });
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
      } else if (block.type === "list") {
        const items = block.items
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        if (items.length === 0) continue;
        cleaned.push({
          type: "list",
          items,
          ...(block.style ? { style: block.style } : {}),
          ...(block.tone ? { tone: block.tone } : {}),
        });
      } else if (block.type === "quote") {
        const text = block.text.trim();
        if (text.length === 0) continue;
        const caption = (block.caption ?? "").trim();
        cleaned.push({
          type: "quote",
          text,
          ...(caption.length > 0 ? { caption } : {}),
          ...(block.tone ? { tone: block.tone } : {}),
        });
      } else if (block.type === "divider") {
        cleaned.push({ type: "divider" });
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProductContent(productId, cleaned, token);
      setBlocks(updated.contentBlocks ?? cleaned);
      setMessage({ type: "success", text: "Đã lưu nội dung thành công." });
      setSuccessOpen(true);
      onSaved?.(updated);
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setMessage({ type: "error", text });
      setErrorText(text);
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  }

  function handleConfirmSave() {
    setConfirmOpen(false);
    void performSave();
  }

  const busy = saving || uploading || replacingIndex !== null;
  const hasBlocks = blocks.length > 0;

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
                <span className={`${TYPE_BADGE} bg-[#273481]/30 text-[#B6D6F2]/70`}>
                  Tiêu đề
                </span>
              )}
              {block.type === "paragraph" && (
                <span className={`${TYPE_BADGE} bg-[#1B1C4A] text-[#B6D6F2]/50`}>
                  Đoạn văn
                </span>
              )}
              {block.type === "image" && (
                <span className={`${TYPE_BADGE} bg-green-900/30 text-green-400/70`}>
                  Ảnh
                </span>
              )}
              {block.type === "list" && (
                <span className={`${TYPE_BADGE} bg-purple-900/25 text-purple-300/70`}>
                  Danh sách
                </span>
              )}
              {block.type === "quote" && (
                <span className={`${TYPE_BADGE} bg-amber-900/20 text-amber-300/70`}>
                  Trích dẫn
                </span>
              )}
              {block.type === "divider" && (
                <span className={`${TYPE_BADGE} bg-[#1B1C4A] text-[#B6D6F2]/35`}>
                  Đường ngăn
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
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={block.level}
                    onChange={(e) =>
                      updateBlock(index, {
                        ...block,
                        level: Number(e.target.value) as 2 | 3,
                      })
                    }
                    className={SELECT_CLS}
                  >
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <AlignButtons
                    value={block.align}
                    onChange={(align) => updateBlock(index, { ...block, align })}
                  />
                  <StyleSelect
                    value={block.tone}
                    onChange={(tone) =>
                      updateBlock(index, {
                        ...block,
                        tone: tone as HeadingBlock["tone"],
                      })
                    }
                    options={TONE_OPTIONS_FULL}
                  />
                  <ItalicToggle
                    active={block.italic}
                    onToggle={() =>
                      updateBlock(index, { ...block, italic: !block.italic })
                    }
                  />
                </div>
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
            )}

            {block.type === "paragraph" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StyleSelect
                    value={block.size ?? "base"}
                    onChange={(size) =>
                      updateBlock(index, {
                        ...block,
                        size: size as ParagraphBlock["size"],
                      })
                    }
                    options={SIZE_OPTIONS}
                  />
                  <StyleSelect
                    value={block.weight}
                    onChange={(weight) =>
                      updateBlock(index, {
                        ...block,
                        weight: weight as ParagraphBlock["weight"],
                      })
                    }
                    options={WEIGHT_OPTIONS}
                  />
                  <AlignButtons
                    value={block.align}
                    onChange={(align) => updateBlock(index, { ...block, align })}
                  />
                  <StyleSelect
                    value={block.tone}
                    onChange={(tone) =>
                      updateBlock(index, {
                        ...block,
                        tone: tone as ParagraphBlock["tone"],
                      })
                    }
                    options={TONE_OPTIONS_FULL}
                  />
                  <ItalicToggle
                    active={block.italic}
                    onToggle={() =>
                      updateBlock(index, { ...block, italic: !block.italic })
                    }
                  />
                </div>
                <textarea
                  value={block.text}
                  onChange={(e) =>
                    updateBlock(index, { ...block, text: e.target.value })
                  }
                  placeholder="Nhập nội dung đoạn văn..."
                  rows={3}
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>
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
                    {replacingIndex === index && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => triggerReplaceImage(index)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-2.5 py-1.5 text-xs text-[#B6D6F2]/60 hover:border-[#273481] hover:text-white transition-all disabled:opacity-40"
                >
                  {replacingIndex === index ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {replacingIndex === index ? "Đang tải ảnh..." : "Thay ảnh"}
                </button>
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
                <p className="text-[10px] text-[#B6D6F2]/30 leading-relaxed">
                  Xóa block này chỉ gỡ ảnh khỏi nội dung sản phẩm, không xóa
                  tệp ảnh trên Cloudinary.
                </p>
              </div>
            )}

            {block.type === "list" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StyleSelect
                    value={block.style}
                    onChange={(style) =>
                      updateBlock(index, {
                        ...block,
                        style: style as ListBlock["style"],
                      })
                    }
                    options={LIST_STYLE_OPTIONS}
                  />
                  <StyleSelect
                    value={block.tone}
                    onChange={(tone) =>
                      updateBlock(index, {
                        ...block,
                        tone: tone as ListBlock["tone"],
                      })
                    }
                    options={TONE_OPTIONS_LIST}
                  />
                </div>
                <div className="space-y-1.5">
                  {block.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) =>
                          updateListItem(index, itemIndex, e.target.value)
                        }
                        placeholder={`Dòng ${itemIndex + 1}...`}
                        className={INPUT_CLS}
                      />
                      <button
                        type="button"
                        className={`${ICON_BTN} hover:text-red-400 hover:bg-red-900/20 shrink-0`}
                        onClick={() => removeListItem(index, itemIndex)}
                        disabled={block.items.length === 1}
                        title="Xóa dòng"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addListItem(index)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-2.5 py-1.5 text-xs text-[#B6D6F2]/60 hover:border-[#273481] hover:text-white transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm dòng
                </button>
              </div>
            )}

            {block.type === "quote" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StyleSelect
                    value={block.tone}
                    onChange={(tone) =>
                      updateBlock(index, {
                        ...block,
                        tone: tone as QuoteBlock["tone"],
                      })
                    }
                    options={TONE_OPTIONS_QUOTE}
                  />
                </div>
                <textarea
                  value={block.text}
                  onChange={(e) =>
                    updateBlock(index, { ...block, text: e.target.value })
                  }
                  placeholder="Nhập nội dung trích dẫn..."
                  rows={2}
                  className={`${INPUT_CLS} resize-none`}
                />
                <input
                  type="text"
                  value={block.caption ?? ""}
                  onChange={(e) =>
                    updateBlock(index, { ...block, caption: e.target.value })
                  }
                  placeholder="Chú thích (tùy chọn)..."
                  className={INPUT_CLS}
                />
              </div>
            )}

            {block.type === "divider" && (
              <div className="py-1">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#273481]/60 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={addHeading} disabled={busy} className={ADD_BLOCK_BTN}>
          <Type className="h-3.5 w-3.5" />
          Thêm tiêu đề
        </button>
        <button type="button" onClick={addParagraph} disabled={busy} className={ADD_BLOCK_BTN}>
          <Pilcrow className="h-3.5 w-3.5" />
          Thêm đoạn văn
        </button>
        <button type="button" onClick={addList} disabled={busy} className={ADD_BLOCK_BTN}>
          <ListIcon className="h-3.5 w-3.5" />
          Thêm danh sách
        </button>
        <button type="button" onClick={addQuote} disabled={busy} className={ADD_BLOCK_BTN}>
          <QuoteIcon className="h-3.5 w-3.5" />
          Thêm trích dẫn
        </button>
        <button
          type="button"
          onClick={triggerImageUpload}
          disabled={busy}
          className={ADD_BLOCK_BTN}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          {uploading ? "Đang tải ảnh..." : "Thêm ảnh"}
        </button>
        <button type="button" onClick={addDivider} disabled={busy} className={ADD_BLOCK_BTN}>
          <SeparatorHorizontal className="h-3.5 w-3.5" />
          Thêm đường ngăn
        </button>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleImageFile}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleReplaceImageFile}
        />
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3">
        {productId && (
          <button
            type="button"
            onClick={requestSave}
            disabled={busy}
            className={PRIMARY_BTN}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu nội dung
          </button>
        )}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1B1C4A] px-3 py-2 text-xs text-[#B6D6F2]/60 hover:border-[#273481] hover:text-white transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          Xem trước
        </button>
      </div>

      {/* Inline status -- secondary feedback only; modals above are primary */}
      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-green-400/80" : "text-red-400/80"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* ── Confirm save modal ──────────────────────────────────────────────── */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        labelledBy="confirm-save-title"
        maxWidthClassName="max-w-md"
      >
        <div className="p-5">
          <h2 id="confirm-save-title" className="text-base font-semibold text-white mb-2">
            Xác nhận lưu nội dung
          </h2>
          <p className="text-sm text-[#B6D6F2]/60 leading-relaxed mb-5">
            Nội dung này sẽ được hiển thị trên trang chi tiết sản phẩm. Bạn có
            chắc muốn lưu thay đổi?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setConfirmOpen(false)} className={SECONDARY_BTN}>
              Hủy
            </button>
            <button type="button" onClick={handleConfirmSave} className={PRIMARY_BTN}>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Success modal ───────────────────────────────────────────────────── */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        labelledBy="save-success-title"
        maxWidthClassName="max-w-md"
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            <h2 id="save-success-title" className="text-base font-semibold text-white">
              Đã lưu nội dung
            </h2>
          </div>
          <p className="text-sm text-[#B6D6F2]/60 leading-relaxed mb-5">
            Nội dung sản phẩm đã được cập nhật và sẽ hiển thị trên trang chi
            tiết sản phẩm.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/products/${productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#B6D6F2]/60 hover:text-white transition-colors underline underline-offset-4"
            >
              Xem trang sản phẩm
            </Link>
            <button type="button" onClick={() => setSuccessOpen(false)} className={PRIMARY_BTN}>
              Tiếp tục chỉnh sửa
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Error modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        labelledBy="save-error-title"
        maxWidthClassName="max-w-md"
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <h2 id="save-error-title" className="text-base font-semibold text-white">
              Không thể lưu nội dung
            </h2>
          </div>
          <p className="text-sm text-[#B6D6F2]/60 leading-relaxed mb-5">{errorText}</p>
          <div className="flex items-center justify-end">
            <button type="button" onClick={() => setErrorOpen(false)} className={PRIMARY_BTN}>
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Upload error modal ──────────────────────────────────────────────── */}
      <Modal
        open={uploadErrorOpen}
        onClose={() => setUploadErrorOpen(false)}
        labelledBy="upload-error-title"
        maxWidthClassName="max-w-md"
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <h2 id="upload-error-title" className="text-base font-semibold text-white">
              Không thể tải ảnh
            </h2>
          </div>
          <p className="text-sm text-[#B6D6F2]/60 leading-relaxed mb-5">{uploadErrorText}</p>
          <div className="flex items-center justify-end">
            <button type="button" onClick={() => setUploadErrorOpen(false)} className={PRIMARY_BTN}>
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Preview modal -- mirrors the bottom "Nội dung chi tiết sản phẩm" section ── */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        labelledBy="preview-modal-title"
        maxWidthClassName="max-w-4xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#1B1C4A] px-6 py-4">
          <div>
            <h2 id="preview-modal-title" className="text-base font-semibold text-white">
              Xem trước giao diện sản phẩm
            </h2>
            <p className="text-xs text-[#B6D6F2]/40 mt-1 max-w-xl">
              Đây là bản xem trước nội dung sẽ hiển thị ở mục &quot;Nội dung chi
              tiết sản phẩm&quot; phía cuối trang sản phẩm. Nội dung chỉ được
              cập nhật chính thức sau khi bấm Lưu nội dung.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-1.5 text-[#B6D6F2]/45 hover:bg-[#1B1C4A] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Nội dung chi tiết sản phẩm
            </h3>
            <p className="text-sm text-[#B6D6F2]/40 mt-1.5">
              Thông tin mở rộng, hình ảnh và ghi chú chi tiết về sản phẩm.
            </p>
          </div>

          <div className="rounded-3xl border border-[#1B1C4A] bg-[#111335]/40 p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
              {hasBlocks ? (
                <ContentBlocksRenderer blocks={blocks} />
              ) : (
                <p className="text-sm text-[#B6D6F2]/30 text-center py-6">
                  Chưa có nội dung để xem trước.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#1B1C4A] px-6 py-4">
          <button type="button" onClick={() => setPreviewOpen(false)} className={SECONDARY_BTN}>
            Đóng
          </button>
          {productId && (
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                setConfirmOpen(true);
              }}
              disabled={busy}
              className={PRIMARY_BTN}
            >
              Lưu nội dung
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
