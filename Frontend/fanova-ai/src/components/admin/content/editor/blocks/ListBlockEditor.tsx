"use client";

import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ListBlock, ListStyle } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

const LIST_STYLES: ListStyle[] = ["bullet", "ordered"];
const LIST_STYLE_LABELS: Record<ListStyle, string> = {
  bullet: "Danh sách chấm",
  ordered: "Danh sách số",
};

interface ListBlockEditorProps {
  block: ListBlock;
  onChange: (block: ListBlock) => void;
}

export default function ListBlockEditor({ block, onChange }: ListBlockEditorProps) {
  const styleId = useId();

  function updateItem(index: number, value: string) {
    const items = [...block.items];
    items[index] = value;
    onChange({ ...block, items });
  }

  function addItem() {
    onChange({ ...block, items: [...block.items, ""] });
  }

  function removeItem(index: number) {
    onChange({ ...block, items: block.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="sm:w-48">
        <BlockFieldLabel htmlFor={styleId}>Kiểu danh sách</BlockFieldLabel>
        <select
          id={styleId}
          value={block.style}
          onChange={(e) => onChange({ ...block, style: e.target.value as ListStyle })}
          className="admin-input"
        >
          {LIST_STYLES.map((style) => <option key={style} value={style}>{LIST_STYLE_LABELS[style]}</option>)}
        </select>
      </div>

      <div>
        <BlockFieldLabel htmlFor={`${styleId}-items`}>Mục danh sách</BlockFieldLabel>
        <div id={`${styleId}-items`} className="flex flex-col gap-1.5">
          {block.items.length === 0 && (
            <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>
              Chưa có mục nào. Bấm &quot;Thêm mục&quot; để bắt đầu.
            </p>
          )}
          {block.items.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span className="w-4 shrink-0 text-right font-mono text-[10px]" style={{ color: "var(--admin-text-subtle)" }}>
                {block.style === "ordered" ? `${index + 1}.` : "•"}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Nhập nội dung mục..."
                aria-label={`Mục ${index + 1}`}
                className="admin-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Xóa mục ${index + 1}`}
                className="admin-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="admin-focus-ring mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors"
          style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Thêm mục
        </button>
      </div>
    </div>
  );
}
