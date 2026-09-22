"use client";

import { useId } from "react";

interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const MAX_LENGTH = 200;

/** The document's title, editable directly in the workspace header. Reuses .admin-input and the
 * same labeled-field convention as every other admin form -- no modal, no separate dialog. */
export default function TitleInput({ value, onChange, error }: TitleInputProps) {
  const id = useId();

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-[10px] font-mono uppercase tracking-[0.10em]" style={{ color: "var(--admin-text-subtle)" }}>
        Tiêu đề nội dung
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Nhập tiêu đề..."
        maxLength={MAX_LENGTH}
        className="admin-input text-lg font-semibold"
        style={{ color: "var(--admin-text)" }}
      />
      {error && (
        <p role="alert" className="mt-1 text-[11px]" style={{ color: "var(--admin-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
