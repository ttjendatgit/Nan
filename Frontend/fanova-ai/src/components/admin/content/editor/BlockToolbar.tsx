"use client";

import { Heading, Image as ImageIcon, Minus, Pilcrow, Plus, Quote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CONTENT_BLOCK_TYPES, contentBlockLabel } from "@/types/contentBlocks";
import type { ContentBlockType } from "@/types/contentBlocks";

const BLOCK_ICONS: Record<ContentBlockType, LucideIcon> = {
  heading: Heading,
  paragraph: Pilcrow,
  quote: Quote,
  divider: Minus,
  image: ImageIcon,
};

interface BlockToolbarProps {
  onAddBlock: (type: ContentBlockType) => void;
}

/** "+ Thêm nội dung" -- one button per block type, always labeled with real text (never
 * icon-only), so the toolbar reads clearly even to someone who doesn't recognize the icons. */
export default function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--admin-surface-muted)", border: "1px solid var(--admin-border)" }}>
      <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--admin-text-subtle)" }}>
        Thêm nội dung
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Thêm khối nội dung">
        {CONTENT_BLOCK_TYPES.map((type) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAddBlock(type)}
              className="admin-focus-ring flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors"
              style={{ borderColor: "var(--admin-border-strong)", background: "var(--admin-surface)", color: "var(--admin-text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-primary)";
                (e.currentTarget as HTMLElement).style.color = "var(--admin-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--admin-border-strong)";
                (e.currentTarget as HTMLElement).style.color = "var(--admin-text-muted)";
              }}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {contentBlockLabel(type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
