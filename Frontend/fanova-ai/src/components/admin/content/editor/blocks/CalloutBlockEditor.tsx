"use client";

import { useId } from "react";
import type { CalloutBlock, CalloutTone } from "@/types/contentBlocks";
import BlockFieldLabel from "./BlockFieldLabel";

const TONES: CalloutTone[] = ["info", "success", "warning"];
const TONE_LABELS: Record<CalloutTone, string> = {
  info: "Thông tin",
  success: "Thành công",
  warning: "Cảnh báo",
};

interface CalloutBlockEditorProps {
  block: CalloutBlock;
  onChange: (block: CalloutBlock) => void;
}

export default function CalloutBlockEditor({ block, onChange }: CalloutBlockEditorProps) {
  const toneId = useId();
  const titleId = useId();
  const textId = useId();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="sm:w-48">
        <BlockFieldLabel htmlFor={toneId}>Sắc thái</BlockFieldLabel>
        <select
          id={toneId}
          value={block.tone}
          onChange={(e) => onChange({ ...block, tone: e.target.value as CalloutTone })}
          className="admin-input"
        >
          {TONES.map((tone) => <option key={tone} value={tone}>{TONE_LABELS[tone]}</option>)}
        </select>
      </div>
      <div>
        <BlockFieldLabel htmlFor={titleId}>Tiêu đề (không bắt buộc)</BlockFieldLabel>
        <input
          id={titleId}
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Ví dụ: Lưu ý quan trọng"
          className="admin-input font-medium"
        />
      </div>
      <div>
        <BlockFieldLabel htmlFor={textId}>Nội dung</BlockFieldLabel>
        <textarea
          id={textId}
          rows={2}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Nhập nội dung ghi chú..."
          className="admin-input resize-y"
        />
      </div>
    </div>
  );
}
