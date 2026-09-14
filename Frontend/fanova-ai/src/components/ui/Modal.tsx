"use client";

import { useEffect, useRef } from "react";

/**
 * Shared admin/product dialog primitive: centered panel + backdrop, Escape to
 * close, scroll lock while open, focus moved to the panel on open.
 *
 * Extracted from the pattern already used in ContentBlockEditor.tsx so every
 * admin surface (Product Options, Pricing Rules, Quote Detail, Design Files,
 * Users, ...) shares one dialog implementation instead of re-inventing it.
 *
 * Consumer audit (2026-09-09): only admin/options/page.tsx imports this.
 * Modal.tsx is safe to migrate to light-surface without affecting public UI.
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  maxWidthClassName?: string;
  children: React.ReactNode;
}

export default function Modal({
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
      {/* Overlay — neutral translucent */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel — white surface for light admin workspace */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative z-10 w-full ${maxWidthClassName} max-h-[85vh] overflow-y-auto rounded-2xl outline-none`}
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 20px 60px rgba(8, 51, 125, 0.12), 0 4px 16px rgba(8, 51, 125, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
