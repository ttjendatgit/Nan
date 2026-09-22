/** Compact field label shared by the block-type editors -- keeps every field genuinely labeled
 * (never placeholder-only) without repeating the same three lines of markup five times. */
export default function BlockFieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[10px] font-mono uppercase tracking-[0.10em]" style={{ color: "var(--admin-text-subtle)" }}>
      {children}
    </label>
  );
}
