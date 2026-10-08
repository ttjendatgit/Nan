"use client";

import { useEffect, useId, useRef, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import QuoteRequestForm from "./QuoteRequestForm";

type FormProps = Omit<ComponentProps<typeof QuoteRequestForm>, "onSuccess" | "onCancel" | "titleId">;

interface QuoteRequestModalProps extends FormProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusablesIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );
}

/**
 * The quote request modal (backdrop + panel + QuoteRequestForm), shared by the product detail page
 * (product quote) and the homepage FinalCTA (general inquiry: no productId). While open it is a
 * proper modal dialog: role="dialog" + aria-modal, labelled by the form's title; focus moves to the
 * first form field, Tab / Shift+Tab stay inside the panel, and on close (button, Escape, backdrop)
 * focus returns to the element that opened it. Also locks body scroll and closes on Escape.
 */
export default function QuoteRequestModal({ open, onClose, ...formProps }: QuoteRequestModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Callers pass a fresh closure each render; keep the latest in a ref so the effect below only
  // re-runs when `open` changes (same as the original inline implementation).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Body scroll lock, Escape to close, focus in / trap / restore.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>("form input, form textarea") ?? focusablesIn(panel)[0];
      (first ?? panel).focus({ preventScroll: true });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = focusablesIn(panelRef.current);
      if (items.length === 0) {
        e.preventDefault();
        panelRef.current.focus({ preventScroll: true });
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panelRef.current.contains(active);
      if (e.shiftKey && (!inside || active === firstItem || active === panelRef.current)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && (!inside || active === lastItem)) {
        e.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      // Return focus to the opener; if it is gone (unmounted) leave focus on the document body.
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
      else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="quote-modal"
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-[#192B88]/25 bg-[#0F1320] shadow-[0_24px_80px_rgba(0,0,0,0.85)] outline-none"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <QuoteRequestForm {...formProps} titleId={titleId} onSuccess={onClose} onCancel={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
