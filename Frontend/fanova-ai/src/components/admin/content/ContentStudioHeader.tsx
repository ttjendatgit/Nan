"use client";

import { ArrowLeft, Circle, Loader2 } from "lucide-react";
import ContentStatusBadge from "./ContentStatusBadge";
import TitleInput from "./TitleInput";

const PRIMARY_BTN =
  "admin-focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
const SECONDARY_BTN =
  "admin-focus-ring flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

interface ContentStudioHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  titleError?: string;
  status: string;
  dirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function ContentStudioHeader({
  title, onTitleChange, titleError, status, dirty, saving, onBack, onSaveDraft, onPublish,
}: ContentStudioHeaderProps) {
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onBack}
        className="admin-focus-ring inline-flex items-center gap-1.5 rounded text-xs transition-colors"
        style={{ color: "var(--admin-text-subtle)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Quay lại nội dung
      </button>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <TitleInput value={title} onChange={onTitleChange} error={titleError} />

          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <ContentStatusBadge status={status} />
            {dirty && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--admin-warning)" }} role="status">
                <Circle className="h-1.5 w-1.5" style={{ fill: "currentColor" }} aria-hidden="true" />
                Có thay đổi chưa lưu
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className={SECONDARY_BTN}
            style={{ borderColor: "var(--admin-border-strong)", color: "var(--admin-text-muted)" }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className={PRIMARY_BTN}
            style={{ background: "var(--admin-primary)" }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xuất bản
          </button>
        </div>
      </div>
    </div>
  );
}
