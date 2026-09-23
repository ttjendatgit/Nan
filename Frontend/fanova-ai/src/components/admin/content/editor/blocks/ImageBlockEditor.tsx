"use client";

import { useId, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { BlockAlign, ImageBlock } from "@/types/contentBlocks";
import type { MediaAsset } from "@/types/media";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import BlockFieldLabel from "./BlockFieldLabel";

const ALIGN_OPTIONS: BlockAlign[] = ["left", "center", "right"];
const ALIGN_LABELS: Record<BlockAlign, string> = {
  left: "Trái",
  center: "Giữa (toàn chiều rộng)",
  right: "Phải",
};

interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
  token: string;
}

/** Image selection goes through the Media Library picker now, not a raw URL field -- upload
 * still happens on the separate /admin/media workspace, this only selects from what's already
 * there. */
export default function ImageBlockEditor({ block, onChange, token }: ImageBlockEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const altId = useId();
  const captionId = useId();
  const alignId = useId();

  function handleSelect(asset: MediaAsset) {
    onChange({
      ...block,
      url: asset.url,
      // Never overwrites an alt text the admin already typed -- only fills it in when empty, so
      // switching images doesn't silently wipe out a caption someone wrote on purpose.
      alt: block.alt || asset.originalName,
    });
    setPickerOpen(false);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <BlockFieldLabel htmlFor="image-picker-trigger">Hình ảnh</BlockFieldLabel>
        {block.url ? (
          <div className="flex items-center gap-2.5 rounded-lg p-2" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.url}
              alt=""
              className="h-12 w-12 shrink-0 rounded object-cover"
              style={{ border: "1px solid var(--admin-border)" }}
            />
            <p className="min-w-0 flex-1 truncate font-mono text-[11px]" style={{ color: "var(--admin-text-muted)" }}>
              {block.url}
            </p>
            <button
              id="image-picker-trigger"
              type="button"
              onClick={() => setPickerOpen(true)}
              className="admin-focus-ring shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors"
              style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
            >
              Đổi ảnh
            </button>
          </div>
        ) : (
          <button
            id="image-picker-trigger"
            type="button"
            onClick={() => setPickerOpen(true)}
            className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs transition-colors"
            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            Chọn hình ảnh từ Thư viện Media
          </button>
        )}
      </div>

      <div>
        <BlockFieldLabel htmlFor={altId}>Văn bản thay thế (alt text)</BlockFieldLabel>
        <input
          id={altId}
          type="text"
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
          placeholder="Mô tả hình ảnh cho người dùng khiếm thị"
          className="admin-input text-xs"
        />
      </div>
      <div>
        <BlockFieldLabel htmlFor={captionId}>Chú thích (không bắt buộc)</BlockFieldLabel>
        <input
          id={captionId}
          type="text"
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Hiển thị bên dưới hình ảnh"
          className="admin-input text-xs"
        />
      </div>
      <div>
        <BlockFieldLabel htmlFor={alignId}>Căn lề hình ảnh</BlockFieldLabel>
        <select
          id={alignId}
          value={block.align ?? "center"}
          onChange={(e) => onChange({ ...block, align: e.target.value as BlockAlign })}
          className="admin-input"
        >
          {ALIGN_OPTIONS.map((align) => <option key={align} value={align}>{ALIGN_LABELS[align]}</option>)}
        </select>
      </div>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} token={token} />
    </div>
  );
}
