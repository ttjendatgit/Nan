"use client";

import { useId, useState } from "react";
import { Images, Plus, Trash2 } from "lucide-react";
import type { GalleryBlock } from "@/types/contentBlocks";
import type { MediaAsset } from "@/types/media";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import BlockFieldLabel from "./BlockFieldLabel";

interface GalleryBlockEditorProps {
  block: GalleryBlock;
  onChange: (block: GalleryBlock) => void;
  token: string;
}

/** Multi-image selection through the same Media Library picker ImageBlockEditor uses, switched
 * into its multi-select mode -- no separate upload/browse logic duplicated here. */
export default function GalleryBlockEditor({ block, onChange, token }: GalleryBlockEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const listId = useId();

  function handleSelectMultiple(assets: MediaAsset[]) {
    const existingUrls = new Set(block.images.map((img) => img.url));
    const additions = assets
      .filter((asset) => !existingUrls.has(asset.url))
      .map((asset) => ({ url: asset.url, alt: asset.originalName }));
    onChange({ ...block, images: [...block.images, ...additions] });
    setPickerOpen(false);
  }

  function updateAlt(index: number, alt: string) {
    const images = [...block.images];
    images[index] = { ...images[index], alt };
    onChange({ ...block, images });
  }

  function removeImage(index: number) {
    onChange({ ...block, images: block.images.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <BlockFieldLabel htmlFor={listId}>Hình ảnh trong bộ sưu tập</BlockFieldLabel>

      {block.images.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs transition-colors"
          style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          Chọn hình ảnh từ Thư viện Media
        </button>
      ) : (
        <div id={listId} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {block.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="rounded-lg p-1.5" style={{ border: "1px solid var(--admin-border)", background: "var(--admin-surface-muted)" }}>
              <div className="relative aspect-square overflow-hidden rounded" style={{ border: "1px solid var(--admin-border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Xóa ảnh ${index + 1}`}
                  className="admin-focus-ring absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "rgba(8,20,38,0.65)", color: "#FFFFFF" }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <input
                type="text"
                value={image.alt}
                onChange={(e) => updateAlt(index, e.target.value)}
                placeholder="Văn bản thay thế (alt)"
                aria-label={`Alt text cho ảnh ${index + 1}`}
                className="admin-input mt-1.5 text-[11px]"
              />
            </div>
          ))}
        </div>
      )}

      {block.images.length > 0 && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="admin-focus-ring flex items-center gap-1.5 self-start rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors"
          style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Thêm ảnh
        </button>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple
        onSelectMultiple={handleSelectMultiple}
        token={token}
      />
    </div>
  );
}
