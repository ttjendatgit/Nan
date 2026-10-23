"use client";

// The Hero's personalisation sequence (R20), shared by the Signature hero and its lab variant.
// The visitor writes a word; when they pause (never mid-IME composition) or press the button, the
// fan folds shut along its own opening path, is reprinted with the word, and opens again.
// Reduced motion: the same steps without the fold. Text rules live in atelier/imprint.ts.

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CompositionEvent, type FormEvent } from "react";
import { IMPRINT_DEFAULT, IMPRINT_MAX, cleanDraft, countGraphemes, toImprint } from "../atelier/imprint";

export type ImprintPhase = "idle" | "printing" | "revealed";

const FOLD_MS = 640;
const PAUSE_MS = 1100;

export function useImprint() {
  const fold = useRef(0);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [word, setWord] = useState(IMPRINT_DEFAULT);
  /* the word last asked for: the quote note follows it at once, before the fold finishes */
  const [requested, setRequested] = useState(IMPRINT_DEFAULT);
  const [phase, setPhase] = useState<ImprintPhase>("idle");
  /* after the first reprint the fan re-opens quicker than on arrival */
  const [reprinted, setReprinted] = useState(false);
  const [announce, setAnnounce] = useState("");
  /* shown under the line when "In thử" is pressed with nothing to print */
  const [error, setError] = useState<string | null>(null);

  const reprint = useCallback(
    (next: string) => {
      if (next === word) return;
      setRequested(next);
      const done = () => {
        fold.current = 0;
        setReprinted(true);
        setWord(next);
        setPhase(next === IMPRINT_DEFAULT ? "idle" : "revealed");
        setAnnounce(next === IMPRINT_DEFAULT ? "Quạt trở về chữ NAN." : `Bản xem trước: quạt in chữ ${next}.`);
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
      setPhase("printing");
      setAnnounce("Đang gấp quạt để in chữ mới.");
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / FOLD_MS);
        // ease-in-out cubic: the slats gather slowly, close firmly
        fold.current = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        if (p < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    },
    [word],
  );

  useEffect(() => {
    if (composing.current || !draft.trim()) return;
    const id = window.setTimeout(() => reprint(toImprint(draft)), PAUSE_MS);
    return () => window.clearTimeout(id);
  }, [draft, reprint]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) {
      setError("Hãy viết ít nhất một chữ để in thử.");
      inputRef.current?.focus();
      return;
    }
    reprint(toImprint(draft));
  };
  const onReset = () => {
    setDraft("");
    reprint(IMPRINT_DEFAULT);
    inputRef.current?.focus(); // the reset button disappears; keep the visitor on the field
  };

  const inputProps = {
    ref: inputRef,
    value: draft,
    autoComplete: "off",
    autoCapitalize: "characters",
    spellCheck: false,
    enterKeyHint: "done" as const,
    maxLength: IMPRINT_MAX * 8, // a hard ceiling for paste; graphemes are limited by cleanDraft
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => {
      composing.current = false;
      setDraft(cleanDraft(e.currentTarget.value));
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setDraft(composing.current ? e.target.value : cleanDraft(e.target.value));
    },
  };

  return {
    fold,
    word,
    requested,
    phase,
    reprinted,
    announce,
    error,
    inputRef,
    custom: word !== IMPRINT_DEFAULT,
    used: countGraphemes(draft.trim()),
    max: IMPRINT_MAX,
    inputProps,
    onSubmit,
    onReset,
    quoteNote: requested !== IMPRINT_DEFAULT ? `Chữ muốn in trên quạt: ${requested}` : undefined,
  };
}
