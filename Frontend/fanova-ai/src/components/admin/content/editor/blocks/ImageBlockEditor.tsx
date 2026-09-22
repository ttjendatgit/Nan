"use client";

import { useId } from "react";
import type { ImageBlock } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
}

/** URL entry only -- file upload and Cloudinary integration are a later phase. */
export default function ImageBlockEditor({ block, onChange }: ImageBlockEditorProps) {
  const urlId = useId();
  const altId = useId();
  const captionId = useId();

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <BlockFieldLabel htmlFor={urlId}>Đường dẫn hình ảnh</BlockFieldLabel>
        <input
          id={urlId}
          type="text"
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="https://... (tải ảnh lên sẽ có ở bước tiếp theo)"
          className="admin-input font-mono text-xs"
        />
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
    </div>
  );
}
