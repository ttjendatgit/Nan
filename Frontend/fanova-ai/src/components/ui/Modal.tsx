"use client";

import { useEffect, useRef } from "react";

/**
 * Shared admin/product dialog primitive: centered panel + backdrop, Escape to
 * close, scroll lock while open, focus moved to the panel on open and
 * returned to whatever triggered it on close.
 *
 * Extracted from the pattern already used in ContentBlockEditor.tsx so every
 * admin surface (Product Options, Pricing Rules, Quote Detail, Design Files,
 * Users, ...) shares one dialog implementation instead of re-inventing it.
 *
 * Consumer audit (2026-09-15): admin/options, admin/products, admin/categories.
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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus lifecycle only -- deliberately keyed on `open` alone (not `onClose`) so it captures
  // the trigger element exactly once per open, and restores focus to it exactly once on close.
  // Keying this on `onClose` too would re-run on every parent re-render while still open (most
  // callers pass an inline arrow function), re-capturing document.activeElement as the modal
  // panel itself instead of the original trigger.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      // The trigger can be gone by the time this runs -- e.g. deleting a row removes the
      // button that opened this modal. Only refocus it if it's still attached to the DOM;
      // otherwise leave focus wherever the consuming page's own re-render naturally puts it.
      if (previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
